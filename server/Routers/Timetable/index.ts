import express from "express";
import mongoose from "mongoose";
import Timetable from "../../models/Timetable";
import ClassModel from "../../models/Class";
import Subject from "../../models/Subject";
import User from "../../models/User";
import Teacher from "../../models/teacherModel";
import { ITeacher } from "../../models/teacherModel";
import {
  verifyToken,
  requireAdmin,
  checkRole,
  AuthRequest,
} from "../../middleware/authMiddleware";

// Helper: given a raw stored teacher reference (could be ObjectId, User._id, Teacher._id, or teacher code like 'GV00002'),
// attempt to resolve to a User or Teacher document (lean). Returns the doc or null.
const resolveTeacherByRawId = async (raw: any) => {
  if (!raw) return null;
  const looksLikeObjectId = (v: string) => /^[0-9a-fA-F]{24}$/.test(v);
  try {
    // Try as User._id
    if (looksLikeObjectId(String(raw))) {
      const u = await User.findById(String(raw))
        .select("_id username name teacherId")
        .lean();
      if (u) return u;
      // Try Teacher by _id
      const t = await Teacher.findById(String(raw)).lean();
      if (t) return t;
    }

    // If raw is a string teacher code like 'GV00002', try User.teacherId or Teacher.teacherId
    if (typeof raw === "string") {
      const u2 = await User.findOne({ teacherId: raw })
        .select("_id username name teacherId")
        .lean();
      if (u2) return u2;
      const t2 = await Teacher.findOne({ teacherId: raw }).lean();
      if (t2) return t2;
    }
  } catch (e) {
    // ignore resolution errors
  }
  return null;
};

const router = express.Router();

// Lấy tất cả thời khóa biểu: admin => tất cả; teacher => chỉ các lớp được phép
router.get("/", verifyToken, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const reqUser = authReq.user;

    // Admin: return all timetables (same as before)
    if (reqUser && reqUser.role === "admin") {
      let timetables = await Timetable.find()
        .populate("classId")
        .populate("schedule.subjectId")
        .populate("schedule.teacherId");

      // Fallback: for any schedule items where populate returned null, try load from Teacher collection
      for (const t of timetables) {
        try {
          const raw = await Timetable.findById(t._id).lean();
          if (
            !raw ||
            !Array.isArray(raw.schedule) ||
            !Array.isArray(t.schedule)
          )
            continue;
          for (let i = 0; i < t.schedule.length; i++) {
            const popItem: any = t.schedule[i] as any;
            const rawItem: any = raw.schedule?.[i];
            if (
              (!popItem.teacherId || popItem.teacherId === null) &&
              rawItem &&
              rawItem.teacherId
            ) {
              try {
                const teacherDoc = await resolveTeacherByRawId(
                  rawItem.teacherId,
                );
                if (teacherDoc) popItem.teacherId = teacherDoc;
              } catch (e) {
                // ignore
              }
            }
          }
        } catch (e) {
          // ignore per-timetable errors
        }
      }

      return res.status(200).json({ data: timetables });
    }

    // Teacher: return timetables only for classes they are allowed to view
    if (reqUser && reqUser.role === "teacher") {
      const rawTokens = [
        reqUser?.id,
        (reqUser as any)?._id,
        (reqUser as any)?.teacherId,
      ]
        .filter(Boolean)
        .map(String);

      console.debug("[GET /timetables] reqUser:", reqUser);
      console.debug("[GET /timetables] rawTokens:", rawTokens);

      const looksLikeObjectId = (v: string) => /^[0-9a-fA-F]{24}$/.test(v);

      const objectIdTokens = rawTokens.filter(looksLikeObjectId);
      const nonObjectTokens = rawTokens.filter((t) => !looksLikeObjectId(t));

      // Resolve non-object tokens (eg teacher code like GV00002) to User._id where possible
      const resolvedUserIds = new Set<string>(objectIdTokens.map(String));
      for (const tok of nonObjectTokens) {
        try {
          // Try find User by teacherId field
          const u = await User.findOne({ teacherId: tok }).select("_id").lean();
          if (u && u._id) {
            resolvedUserIds.add(String(u._id));
            continue;
          }
          // Try find Teacher doc then linked User
          const tdoc = await Teacher.findOne({ teacherId: tok }).lean();
          if (tdoc) {
            const linked = await User.findOne({
              $or: [{ teacherRef: tdoc._id }, { teacherId: tdoc.teacherId }],
            })
              .select("_id")
              .lean();
            if (linked && linked._id) {
              resolvedUserIds.add(String(linked._id));
            }
          }
        } catch (e) {
          console.warn("Could not resolve token to user id:", tok, e);
        }
      }

      const tokenUserIds = Array.from(resolvedUserIds);
      console.debug("[GET /timetables] resolved tokenUserIds:", tokenUserIds);

      const classes = await ClassModel.find({
        $or: [
          { teacherId: { $in: tokenUserIds } },
          { "subjectTeachers.teacherId": { $in: tokenUserIds } },
          { allowedViewTeachers: { $in: tokenUserIds } },
        ],
      }).select("_id");

      const classIds = classes.map((c: any) => c._id);
      console.debug(
        "[GET /timetables] classes found:",
        classes.length,
        "classIds:",
        classIds,
      );
      let timetables = [] as any[];
      if (classIds.length > 0) {
        timetables = await Timetable.find({ classId: { $in: classIds } })
          .populate("classId")
          .populate("schedule.subjectId")
          .populate("schedule.teacherId");

        // apply same teacher fallback population
        for (const t of timetables) {
          try {
            const raw = await Timetable.findById(t._id).lean();
            if (
              !raw ||
              !Array.isArray(raw.schedule) ||
              !Array.isArray(t.schedule)
            )
              continue;
            for (let i = 0; i < t.schedule.length; i++) {
              const popItem: any = t.schedule[i] as any;
              const rawItem: any = raw.schedule?.[i];
              if (
                (!popItem.teacherId || popItem.teacherId === null) &&
                rawItem &&
                rawItem.teacherId
              ) {
                try {
                  const teacherDoc = await resolveTeacherByRawId(
                    rawItem.teacherId,
                  );
                  if (teacherDoc) popItem.teacherId = teacherDoc;
                } catch (e) {
                  // ignore
                }
              }
            }
          } catch (e) {
            // ignore per-timetable errors
          }
        }
      }

      return res.status(200).json({ data: timetables });
    }

    // Other roles: forbidden
    return res
      .status(403)
      .json({ message: "Forbidden: Insufficient permissions" });
  } catch (err: any) {
    console.error(err && err.stack ? err.stack : err);
    res
      .status(500)
      .json({ message: "Server error", error: err?.message || String(err) });
  }
});

// Lấy thời khóa biểu theo lớp (require auth; teachers only if allowed)
router.get("/class/:classId", verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const timetable = await Timetable.findOne({ classId })
      .populate("classId")
      .populate("schedule.subjectId")
      .populate("schedule.teacherId");
    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });

    // Authorization: admin can view any; teachers only if they are assigned or explicitly allowed
    const authReq = req as AuthRequest;
    const reqUser = authReq.user;
    if (reqUser && reqUser.role === "teacher") {
      const rawTokens = [
        reqUser?.id,
        (reqUser as any)?._id,
        (reqUser as any)?.teacherId,
      ]
        .filter(Boolean)
        .map(String);
      const looksLikeObjectId = (v: string) => /^[0-9a-fA-F]{24}$/.test(v);
      const objectIdTokens = rawTokens.filter(looksLikeObjectId);
      const nonObjectTokens = rawTokens.filter((t) => !looksLikeObjectId(t));
      const resolvedUserIds = new Set<string>(objectIdTokens.map(String));
      for (const tok of nonObjectTokens) {
        try {
          const u = await User.findOne({ teacherId: tok }).select("_id").lean();
          if (u && u._id) {
            resolvedUserIds.add(String(u._id));
            continue;
          }
          const tdoc = await Teacher.findOne({ teacherId: tok }).lean();
          if (tdoc) {
            const linked = await User.findOne({
              $or: [{ teacherRef: tdoc._id }, { teacherId: tdoc.teacherId }],
            })
              .select("_id")
              .lean();
            if (linked && linked._id) resolvedUserIds.add(String(linked._id));
          }
        } catch (e) {
          console.warn("Could not resolve token to user id:", tok, e);
        }
      }

      const tokenUserIds = Array.from(resolvedUserIds);

      // load class doc to verify
      const cls = await ClassModel.findById(classId).lean();
      let allowed = false;
      if (cls) {
        if (cls.teacherId && tokenUserIds.includes(String(cls.teacherId)))
          allowed = true;
        // subjectTeachers entries
        if (!allowed && Array.isArray((cls as any).subjectTeachers)) {
          for (const st of (cls as any).subjectTeachers) {
            const stTid = st.teacherId?._id || st.teacherId;
            if (stTid && tokenUserIds.includes(String(stTid))) {
              allowed = true;
              break;
            }
          }
        }
        // explicit allowedViewTeachers
        if (!allowed && Array.isArray((cls as any).allowedViewTeachers)) {
          for (const tId of (cls as any).allowedViewTeachers) {
            if (tokenUserIds.includes(String(tId))) {
              allowed = true;
              break;
            }
          }
        }
      }

      if (!allowed) {
        return res.status(403).json({
          message: "Bạn không có quyền xem thời khóa biểu của lớp này",
        });
      }
    }
    res.status(200).json({ data: timetable });
  } catch (err: any) {
    console.error(err && err.stack ? err.stack : err);
    res
      .status(500)
      .json({ message: "Server error", error: err?.message || String(err) });
  }
});

// GET timetables the current teacher is allowed to view
router.get(
  "/allowed",
  verifyToken,
  checkRole(["teacher", "admin"]),
  async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const reqUser = authReq.user;

      // Admin gets all
      if (reqUser && reqUser.role === "admin") {
        const timetables = await Timetable.find()
          .populate("classId")
          .populate("schedule.subjectId")
          .populate("schedule.teacherId");
        return res.status(200).json({ data: timetables });
      }

      // Build token ids similar to grade route
      const rawTokens = [
        reqUser?.id,
        (reqUser as any)?._id,
        (reqUser as any)?.teacherId,
      ]
        .filter(Boolean)
        .map(String);
      const looksLikeObjectId = (v: string) => /^[0-9a-fA-F]{24}$/.test(v);
      const objectIdTokens = rawTokens.filter(looksLikeObjectId);
      const nonObjectTokens = rawTokens.filter((t) => !looksLikeObjectId(t));
      const resolvedUserIds = new Set<string>(objectIdTokens.map(String));
      for (const tok of nonObjectTokens) {
        try {
          const u = await User.findOne({ teacherId: tok }).select("_id").lean();
          if (u && u._id) {
            resolvedUserIds.add(String(u._id));
            continue;
          }
          const tdoc = await Teacher.findOne({ teacherId: tok }).lean();
          if (tdoc) {
            const linked = await User.findOne({
              $or: [{ teacherRef: tdoc._id }, { teacherId: tdoc.teacherId }],
            })
              .select("_id")
              .lean();
            if (linked && linked._id) resolvedUserIds.add(String(linked._id));
          }
        } catch (e) {
          console.warn("Could not resolve token to user id:", tok, e);
        }
      }

      const tokenUserIds = Array.from(resolvedUserIds);

      // Find classes where teacher is homeroom, subject teacher, or explicitly allowed
      const classes = await ClassModel.find({
        $or: [
          { teacherId: { $in: tokenUserIds } },
          { "subjectTeachers.teacherId": { $in: tokenUserIds } },
          { allowedViewTeachers: { $in: tokenUserIds } },
        ],
      }).select("_id");

      const classIds = classes.map((c: any) => c._id);
      const timetables = await Timetable.find({ classId: { $in: classIds } })
        .populate("classId")
        .populate("schedule.subjectId")
        .populate("schedule.teacherId");

      // Fallback: for any schedule items where populate returned null, try load from Teacher collection
      for (const t of timetables) {
        try {
          const raw = await Timetable.findById(t._id).lean();
          if (
            !raw ||
            !Array.isArray(raw.schedule) ||
            !Array.isArray(t.schedule)
          )
            continue;
          for (let i = 0; i < t.schedule.length; i++) {
            const popItem: any = t.schedule[i] as any;
            const rawItem: any = raw.schedule?.[i];
            if (
              (!popItem.teacherId || popItem.teacherId === null) &&
              rawItem &&
              rawItem.teacherId
            ) {
              try {
                const teacherDoc = await resolveTeacherByRawId(
                  rawItem.teacherId,
                );
                if (teacherDoc) popItem.teacherId = teacherDoc;
              } catch (e) {
                // ignore missing teacher fallback
              }
            }
          }
        } catch (e) {
          // ignore per-timetable errors
        }
      }

      res.status(200).json({ data: timetables });
    } catch (err: any) {
      console.error(err && err.stack ? err.stack : err);
      res
        .status(500)
        .json({ message: "Server error", error: err?.message || String(err) });
    }
  },
);

// Lấy chi tiết một thời khóa biểu (require auth; teachers only if allowed)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate("classId")
      .populate("schedule.subjectId")
      .populate("schedule.teacherId");
    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });
    // Fallback: attach Teacher docs where populate returned null
    try {
      const raw = await Timetable.findById(req.params.id).lean();
      if (
        raw &&
        Array.isArray(raw.schedule) &&
        Array.isArray(timetable.schedule)
      ) {
        for (let i = 0; i < timetable.schedule.length; i++) {
          const popItem: any = timetable.schedule[i] as any;
          const rawItem: any = raw.schedule?.[i];
          if (
            (!popItem.teacherId || popItem.teacherId === null) &&
            rawItem &&
            rawItem.teacherId
          ) {
            try {
              const teacherDoc = await resolveTeacherByRawId(rawItem.teacherId);
              if (teacherDoc) popItem.teacherId = teacherDoc;
            } catch (e) {
              // ignore
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }

    // Authorization: admin can view any; teachers only if they are assigned or explicitly allowed
    const authReq = req as AuthRequest;
    const reqUser = authReq.user;
    if (reqUser && reqUser.role === "teacher") {
      const rawTokens = [
        reqUser?.id,
        (reqUser as any)?._id,
        (reqUser as any)?.teacherId,
      ]
        .filter(Boolean)
        .map(String);
      const looksLikeObjectId = (v: string) => /^[0-9a-fA-F]{24}$/.test(v);
      const objectIdTokens = rawTokens.filter(looksLikeObjectId);
      const nonObjectTokens = rawTokens.filter((t) => !looksLikeObjectId(t));
      const resolvedUserIds = new Set<string>(objectIdTokens.map(String));
      for (const tok of nonObjectTokens) {
        try {
          const u = await User.findOne({ teacherId: tok }).select("_id").lean();
          if (u && u._id) {
            resolvedUserIds.add(String(u._id));
            continue;
          }
          const tdoc = await Teacher.findOne({ teacherId: tok }).lean();
          if (tdoc) {
            const linked = await User.findOne({
              $or: [{ teacherRef: tdoc._id }, { teacherId: tdoc.teacherId }],
            })
              .select("_id")
              .lean();
            if (linked && linked._id) {
              resolvedUserIds.add(String(linked._id));
            }
          }
        } catch (e) {
          console.warn("Could not resolve token to user id:", tok, e);
        }
      }

      const tokenUserIds = Array.from(resolvedUserIds);

      // load class doc to verify
      const cls = await ClassModel.findById(timetable.classId).lean();
      let allowed = false;
      if (cls) {
        if (cls.teacherId && tokenUserIds.includes(String(cls.teacherId)))
          allowed = true;
        if (!allowed && Array.isArray((cls as any).subjectTeachers)) {
          for (const st of (cls as any).subjectTeachers) {
            const stTid = st.teacherId?._id || st.teacherId;
            if (stTid && tokenUserIds.includes(String(stTid))) {
              allowed = true;
              break;
            }
          }
        }
        if (!allowed && Array.isArray((cls as any).allowedViewTeachers)) {
          for (const tId of (cls as any).allowedViewTeachers) {
            if (tokenUserIds.includes(String(tId))) {
              allowed = true;
              break;
            }
          }
        }
      }

      if (!allowed) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xem thời khóa biểu này" });
      }
    }

    res.status(200).json({ data: timetable });
  } catch (err: any) {
    console.error(err && err.stack ? err.stack : err);
    res
      .status(500)
      .json({ message: "Server error", error: err?.message || String(err) });
  }
});

// Tạo thời khóa biểu mới
router.post("/", async (req, res) => {
  try {
    const { classId, schedule } = req.body;

    console.log("\n📥 [POST /timetables] ================================");
    console.log("📥 classId:", classId);
    console.log("📥 Raw schedule received:");
    console.log(JSON.stringify(schedule, null, 2));

    // Log each item
    schedule.forEach((s: any, idx: number) => {
      console.log(`   Schedule[${idx}]:`, {
        day: s.day,
        subjectId: s.subjectId,
        teacherId: s.teacherId,
        teacherId_type: typeof s.teacherId,
        teacherId_empty:
          s.teacherId === "" || s.teacherId === null || !s.teacherId,
      });
    });
    console.log("================================\n");

    // Validate input
    if (!classId) {
      console.error("❌ [POST /timetables] classId is missing");
      return res.status(400).json({ message: "classId is required" });
    }
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      console.error("❌ [POST /timetables] schedule is invalid");
      return res.status(400).json({ message: "schedule array is required" });
    }

    const cls = await ClassModel.findById(classId);
    if (!cls) {
      console.error(`❌ [POST /timetables] Class not found: ${classId}`);
      return res.status(404).json({ message: "Class not found" });
    }

    console.log(`✅ [POST /timetables] Found class: ${cls.classCode}`);

    // Sanitize schedule: convert empty string teacherId to null
    const sanitizedSchedule = schedule.map((s: any) => ({
      ...s,
      teacherId:
        s.teacherId && String(s.teacherId).trim() !== "" ? s.teacherId : null,
    }));

    console.log("✂️  [POST /timetables] After sanitize:");
    sanitizedSchedule.forEach((s: any, idx: number) => {
      console.log(
        `   Schedule[${idx}] teacherId:`,
        s.teacherId,
        `(type: ${typeof s.teacherId})`,
      );
    });

    // Convert teacherId strings to ObjectIds for MongoDB
    sanitizedSchedule.forEach((s: any) => {
      if (s.teacherId && typeof s.teacherId === "string") {
        try {
          s.teacherId = new mongoose.Types.ObjectId(s.teacherId);
          console.log(
            `✅ [POST /timetables] Converted teacherId to ObjectId: ${s.teacherId}`,
          );
        } catch (err) {
          console.warn(
            `⚠️ [POST /timetables] Failed to convert teacherId: ${s.teacherId}`,
          );
          s.teacherId = null;
        }
      }
    });

    // Kiểm tra tất cả subjectId và teacherId trong schedule có tồn tại không
    for (const s of sanitizedSchedule) {
      // allow empty subjectId (day off) — skip validation when missing
      if (!s.subjectId) continue;
      const subj = await Subject.findById(s.subjectId);
      if (!subj) {
        console.error(
          `❌ [POST /timetables] Subject not found: ${s.subjectId}`,
        );
        return res
          .status(404)
          .json({ message: `Subject ${s.subjectId} not found` });
      }

      // Validate teacherId if provided - log warning but don't fail
      if (s.teacherId) {
        // Try User collection first (for backward compatibility with user-based teachers)
        let teacher = await User.findById(s.teacherId);

        // If not found in User, try Teacher collection
        if (!teacher) {
          teacher = await Teacher.findById(s.teacherId);
        }

        if (!teacher) {
          console.warn(
            `⚠️ [POST /timetables] Teacher ${s.teacherId} NOT FOUND in User or Teacher collection`,
          );
          // Get diagnostic info
          const teacherCount = await Teacher.countDocuments();
          const userTeacherCount = await User.countDocuments({
            role: "teacher",
          });
          console.warn(
            `   📊 Teacher collection has ${teacherCount} docs, User collection has ${userTeacherCount} teachers`,
          );

          // Convert to null instead of returning error
          s.teacherId = null;
        } else {
          console.log(`✅ [POST /timetables] Teacher ${s.teacherId} found`);
        }
      }
    }

    let timetable = await Timetable.findOne({ classId });
    if (timetable) {
      // Merge new schedule items with existing ones to preserve old weeks (history)
      // Avoid duplicates by checking: week + day + startTime + endTime + subjectId
      const existingSchedule = timetable.schedule || [];
      const mergedSchedule = [...existingSchedule];

      for (const newItem of sanitizedSchedule) {
        const key = `${newItem.week || ""}::${newItem.day}::${newItem.startTime}::${newItem.endTime}::${newItem.subjectId || ""}`;
        const isDuplicate = existingSchedule.some((existing: any) => {
          const existingKey = `${existing.week || ""}::${existing.day}::${existing.startTime}::${existing.endTime}::${existing.subjectId || ""}`;
          return key === existingKey;
        });
        if (!isDuplicate) {
          mergedSchedule.push(newItem);
        }
      }

      timetable.schedule = mergedSchedule;
      console.log(
        "💾 [POST /timetables] Saving merged schedule (UPDATE existing):",
        mergedSchedule.map((s) => ({ day: s.day, teacherId: s.teacherId })),
      );
      await timetable.save();
    } else {
      console.log(
        "💾 [POST /timetables] Creating NEW timetable with sanitizedSchedule:",
        sanitizedSchedule.map((s) => ({ day: s.day, teacherId: s.teacherId })),
      );
      timetable = new Timetable({ classId, schedule: sanitizedSchedule });
      await timetable.save();
    }

    // --- Sync schedule to students' user accounts ---
    // declare these in outer scope so we can reuse populatedUser for the response below
    let populatedUser: any = null;
    let rawSaved: any = null;
    try {
      // populate subject names and teacher info for a user-friendly schedule
      // First try populating teacherId from the User collection
      populatedUser = await Timetable.findById(timetable._id)
        .populate("schedule.subjectId")
        .populate({ path: "schedule.teacherId", model: "User" });

      // Also fetch the raw saved document (lean) to access stored teacherId ObjectIds
      rawSaved = await Timetable.findById(timetable._id).lean();

      // For any schedule entries where populate returned null, try fetching from Teacher collection
      if (populatedUser && Array.isArray(populatedUser.schedule)) {
        for (let i = 0; i < populatedUser.schedule.length; i++) {
          const popItem: any = populatedUser.schedule[i];
          const rawItem: any = rawSaved?.schedule?.[i];
          if (
            (!popItem.teacherId || popItem.teacherId === null) &&
            rawItem &&
            rawItem.teacherId
          ) {
            try {
              const teacherDoc = await resolveTeacherByRawId(rawItem.teacherId);
              if (teacherDoc) popItem.teacherId = teacherDoc;
            } catch (err) {
              // ignore and leave as null
            }
          }
        }
      }

      // Convert populatedUser (Mongoose doc) to plain object so modifications persist
      if (populatedUser && typeof populatedUser.toObject === "function") {
        populatedUser = populatedUser.toObject();
        // ensure classId is populated (attach class doc if available)
        try {
          const clsPop = await ClassModel.findById(populatedUser.classId);
          if (clsPop)
            populatedUser.classId = clsPop.toObject
              ? clsPop.toObject()
              : clsPop;
        } catch (e) {
          // ignore
        }
      }

      const populated = populatedUser;

      const userSchedule = (populated?.schedule || []).map((s: any) => ({
        day: s.day,
        subject:
          (s.subjectId && (s.subjectId.name || s.subjectId.title)) ||
          (s.subjectId ? String(s.subjectId) : "Trống"),
        teacher: s.teacherId
          ? s.teacherId.name || String(s.teacherId._id)
          : null,
        startTime: s.startTime,
        endTime: s.endTime,
      }));

      // --- Update class.subjectTeachers and teacher.subjectClasses based on schedule ---
      try {
        for (const item of rawSaved?.schedule || []) {
          if (!item || !item.subjectId || !item.teacherId) continue;
          const subjectIdStr = String(item.subjectId);
          const teacherObjId = item.teacherId;

          // Resolve subject doc
          const subjDoc: any = await Subject.findById(subjectIdStr).lean();
          if (!subjDoc) continue;

          // Resolve teacher: prefer User, fallback to Teacher
          let userTeacher = await User.findById(teacherObjId).lean();
          let teacherDoc = null as any;
          if (!userTeacher) {
            teacherDoc = await Teacher.findById(teacherObjId).lean();
            if (teacherDoc) {
              userTeacher = await User.findOne({
                $or: [
                  { teacherRef: teacherDoc._id },
                  { teacherId: teacherDoc.teacherId },
                ],
              }).lean();
            }
          } else {
            if (userTeacher.teacherRef) {
              teacherDoc = await Teacher.findById(
                userTeacher.teacherRef,
              ).lean();
            } else if (userTeacher.teacherId) {
              teacherDoc = await Teacher.findOne({
                teacherId: userTeacher.teacherId,
              }).lean();
            }
          }

          const finalUserId = userTeacher?._id || null;
          const teacherName =
            (userTeacher && (userTeacher.username || userTeacher.name)) ||
            (teacherDoc && teacherDoc.name) ||
            null;

          // Update ClassModel.subjectTeachers: upsert entry for subjectId
          try {
            const clsDoc: any = await ClassModel.findById(cls._id);
            if (clsDoc) {
              const existing: any = (clsDoc.subjectTeachers || []).find(
                (st: any) => String(st.subjectId) === String(subjectIdStr),
              ) as any;
              if (existing) {
                existing.teacherId = finalUserId || existing.teacherId;
                existing.teacherName = teacherName || existing.teacherName;
                existing.subjectName = subjDoc.name || existing.subjectName;
              } else if (finalUserId) {
                clsDoc.subjectTeachers = clsDoc.subjectTeachers || [];
                clsDoc.subjectTeachers.push({
                  subjectId: (subjDoc._id as any) || String(subjDoc._id),
                  subjectName:
                    (subjDoc as any).name ||
                    (subjDoc as any).title ||
                    String((subjDoc as any)._id),
                  teacherId:
                    (finalUserId as any) ||
                    (existing && existing.teacherId) ||
                    null,
                  teacherName: teacherName || "",
                });
              }
              await clsDoc.save();
            }
          } catch (e) {
            console.warn("⚠️ Could not update Class.subjectTeachers:", e);
          }

          // Update TeacherModel.subjectClasses (store subject names)
          try {
            if (teacherDoc || userTeacher) {
              let tdoc = teacherDoc;
              if (!tdoc && userTeacher?.teacherRef) {
                tdoc = await Teacher.findById(userTeacher.teacherRef).lean();
              }
              if (!tdoc && userTeacher?.teacherId) {
                tdoc = await Teacher.findOne({
                  teacherId: userTeacher.teacherId,
                }).lean();
              }
              if (tdoc) {
                const current = tdoc.subjectClasses || [];
                const subjName =
                  (subjDoc as any).name ||
                  (subjDoc as any).title ||
                  String((subjDoc as any)._id);
                if (!current.includes(subjName)) {
                  await Teacher.updateOne(
                    { _id: tdoc._id },
                    { $addToSet: { subjectClasses: subjName } },
                  );
                  try {
                    const {
                      syncTeacherToUser,
                    } = require("../../utils/syncUserData");
                    await syncTeacherToUser(tdoc);
                  } catch (e) {
                    console.warn(
                      "⚠️ syncTeacherToUser failed for timetable update:",
                      e,
                    );
                  }
                }
              }
            }
          } catch (e) {
            console.warn("⚠️ Could not update Teacher.subjectClasses:", e);
          }
        }
      } catch (err) {
        console.warn(
          "⚠️ Error while updating class/teacher subject assignments:",
          err,
        );
      }

      const clsStudents = (cls.studentIds || []).map((id: any) => id);
      if (clsStudents.length > 0) {
        await User.updateMany(
          { _id: { $in: clsStudents } },
          { $set: { schedule: userSchedule } },
        );
      }

      // (no teacher user sync here — keep original behavior: only students receive schedule)
    } catch (syncErr) {
      console.error("Failed to sync timetable to users:", syncErr);
    }

    // Use the populatedUser (with fallbacks applied) as the response to preserve any
    // teacher fallbacks we attached above instead of re-querying which would lose them.
    if (populatedUser) {
      try {
        await populatedUser.populate("classId");
      } catch (e) {
        // ignore populate errors
      }
    }

    // If populatedUser is not available (e.g., sync failed), fall back to a fresh populated query
    let responseTimetable: any = populatedUser;
    if (!responseTimetable) {
      responseTimetable = await Timetable.findById(timetable._id)
        .populate("classId")
        .populate("schedule.subjectId")
        .populate("schedule.teacherId");
    }

    console.log(
      "📤 [POST /timetables] Response schedule (populated):",
      responseTimetable?.schedule?.map((s: any) => ({
        day: s.day,
        teacherId: s.teacherId,
      })),
    );

    res
      .status(201)
      .json({ message: "Timetable created", timetable: responseTimetable });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Cập nhật thời khóa biểu
router.patch("/:id", async (req, res) => {
  try {
    const { schedule } = req.body;

    // Sanitize schedule: convert empty string teacherId to null
    const sanitizedSchedule = schedule.map((s: any) => ({
      ...s,
      teacherId:
        s.teacherId && String(s.teacherId).trim() !== "" ? s.teacherId : null,
    }));

    // Convert teacherId strings to ObjectIds for MongoDB
    sanitizedSchedule.forEach((s: any) => {
      if (s.teacherId && typeof s.teacherId === "string") {
        try {
          s.teacherId = new mongoose.Types.ObjectId(s.teacherId);
          console.log(
            `✅ [PATCH /timetables/:id] Converted teacherId to ObjectId: ${s.teacherId}`,
          );
        } catch (err) {
          console.warn(
            `⚠️ [PATCH /timetables/:id] Failed to convert teacherId: ${s.teacherId}`,
          );
          s.teacherId = null;
        }
      }
    });

    // Kiểm tra tất cả subjectId và teacherId có tồn tại không (skip empty -> day off)
    for (const s of sanitizedSchedule) {
      if (!s.subjectId) continue;
      const subj = await Subject.findById(s.subjectId);
      if (!subj) {
        console.error(
          `❌ [PATCH /timetables/:id] Subject not found: ${s.subjectId}`,
        );
        return res
          .status(404)
          .json({ message: `Subject ${s.subjectId} not found` });
      }

      // Validate teacherId if provided - log warning but don't fail
      if (s.teacherId) {
        // Try User collection first (for backward compatibility with user-based teachers)
        let teacher = await User.findById(s.teacherId);

        // If not found in User, try Teacher collection
        if (!teacher) {
          teacher = await Teacher.findById(s.teacherId);
        }

        if (!teacher) {
          console.warn(
            `⚠️ [PATCH /timetables/:id] Teacher not found in either User or Teacher collection: ${s.teacherId} - will be stored as null`,
          );
          // Convert to null instead of returning error
          s.teacherId = null;
        } else {
          console.log(
            `✅ [PATCH /timetables/:id] Teacher validated: ${s.teacherId}`,
          );
        }
      }
    }

    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { schedule: sanitizedSchedule },
      { new: true },
    )
      .populate("classId")
      .populate("schedule.subjectId")
      .populate("schedule.teacherId");

    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });

    // --- Sync schedule to students' user accounts ---
    try {
      // timetable is already populated with subjectId and teacherId
      // If some teacherId entries are null (because they point to Teacher collection),
      // fetch Teacher docs and attach them to the populated timetable before building userSchedule
      const rawSaved = await Timetable.findById(timetable._id).lean();
      if (
        rawSaved &&
        Array.isArray(rawSaved.schedule) &&
        Array.isArray(timetable.schedule)
      ) {
        for (let i = 0; i < timetable.schedule.length; i++) {
          const popItem: any = timetable.schedule[i] as any;
          const rawItem: any = rawSaved.schedule?.[i];
          if (
            (!popItem.teacherId || popItem.teacherId === null) &&
            rawItem &&
            rawItem.teacherId
          ) {
            try {
              const teacherDoc = await Teacher.findById(rawItem.teacherId);
              if (teacherDoc) {
                console.log(
                  `✅ [PATCH /timetables/:id] Fallback populated teacher from Teacher collection: ${rawItem.teacherId}`,
                );
                popItem.teacherId = teacherDoc;
              }
            } catch (err) {
              // ignore and leave as null
            }
          }
        }
      }

      const userSchedule = (timetable.schedule || []).map((s: any) => ({
        day: s.day,
        subject:
          (s.subjectId && (s.subjectId.name || s.subjectId.title)) ||
          (s.subjectId ? String(s.subjectId) : "Trống"),
        teacher: s.teacherId
          ? s.teacherId.name || String(s.teacherId._id)
          : null,
        startTime: s.startTime,
        endTime: s.endTime,
      }));

      // --- Update class.subjectTeachers and teacher.subjectClasses based on schedule (PATCH flow) ---
      try {
        const rawSaved = await Timetable.findById(timetable._id).lean();
        for (const item of rawSaved?.schedule || []) {
          if (!item || !item.subjectId || !item.teacherId) continue;
          const subjectIdStr = String(item.subjectId);
          const teacherObjId = item.teacherId;

          const subjDoc = await Subject.findById(subjectIdStr).lean();
          if (!subjDoc) continue;

          let userTeacher = await User.findById(teacherObjId).lean();
          let teacherDoc = null as any;
          if (!userTeacher) {
            teacherDoc = await Teacher.findById(teacherObjId).lean();
            if (teacherDoc) {
              userTeacher = await User.findOne({
                $or: [
                  { teacherRef: teacherDoc._id },
                  { teacherId: teacherDoc.teacherId },
                ],
              }).lean();
            }
          } else {
            if (userTeacher.teacherRef) {
              teacherDoc = await Teacher.findById(
                userTeacher.teacherRef,
              ).lean();
            } else if (userTeacher.teacherId) {
              teacherDoc = await Teacher.findOne({
                teacherId: userTeacher.teacherId,
              }).lean();
            }
          }

          const finalUserId = userTeacher?._id || null;
          const teacherName =
            (userTeacher && (userTeacher.username || userTeacher.name)) ||
            (teacherDoc && teacherDoc.name) ||
            null;

          try {
            const clsDoc: any = await ClassModel.findById(timetable.classId);
            if (clsDoc) {
              const existing: any = (clsDoc.subjectTeachers || []).find(
                (st: any) => String(st.subjectId) === String(subjectIdStr),
              ) as any;
              if (existing) {
                existing.teacherId = finalUserId || existing.teacherId;
                existing.teacherName = teacherName || existing.teacherName;
                existing.subjectName = subjDoc.name || existing.subjectName;
              } else if (finalUserId) {
                clsDoc.subjectTeachers = clsDoc.subjectTeachers || [];
                clsDoc.subjectTeachers.push({
                  subjectId: (subjDoc._id as any) || String(subjDoc._id),
                  subjectName:
                    (subjDoc as any).name ||
                    (subjDoc as any).title ||
                    String((subjDoc as any)._id),
                  teacherId:
                    (finalUserId as any) ||
                    (existing && existing.teacherId) ||
                    null,
                  teacherName: teacherName || "",
                });
              }
              await clsDoc.save();
            }
          } catch (e) {
            console.warn(
              "⚠️ Could not update Class.subjectTeachers (PATCH):",
              e,
            );
          }

          try {
            if (teacherDoc || userTeacher) {
              let tdoc = teacherDoc;
              if (!tdoc && userTeacher?.teacherRef) {
                tdoc = await Teacher.findById(userTeacher.teacherRef).lean();
              }
              if (!tdoc && userTeacher?.teacherId) {
                tdoc = await Teacher.findOne({
                  teacherId: userTeacher.teacherId,
                }).lean();
              }
              if (tdoc) {
                const current = tdoc.subjectClasses || [];
                const subjName =
                  (subjDoc as any).name ||
                  (subjDoc as any).title ||
                  String((subjDoc as any)._id);
                if (!current.includes(subjName)) {
                  await Teacher.updateOne(
                    { _id: tdoc._id },
                    { $addToSet: { subjectClasses: subjName } },
                  );
                  try {
                    const {
                      syncTeacherToUser,
                    } = require("../../utils/syncUserData");
                    await syncTeacherToUser(tdoc);
                  } catch (e) {
                    console.warn(
                      "⚠️ syncTeacherToUser failed for timetable PATCH:",
                      e,
                    );
                  }
                }
              }
            }
          } catch (e) {
            console.warn(
              "⚠️ Could not update Teacher.subjectClasses (PATCH):",
              e,
            );
          }
        }
      } catch (err) {
        console.warn(
          "⚠️ Error while updating class/teacher subject assignments (PATCH):",
          err,
        );
      }

      const cls = await ClassModel.findById(timetable.classId);
      const clsStudents = (cls?.studentIds || []).map((id: any) => id);
      if (clsStudents.length > 0) {
        await User.updateMany(
          { _id: { $in: clsStudents } },
          { $set: { schedule: userSchedule } },
        );
      }

      // (no teacher user sync here)
    } catch (syncErr) {
      console.error("Failed to sync updated timetable to users:", syncErr);
    }

    res.status(200).json({ message: "Timetable updated", timetable });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Xóa thời khóa biểu
router.delete("/:id", async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });
    res.status(200).json({ message: "Timetable deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;

// --- Admin endpoint: backfill/sync all timetables into users collection ---
router.post("/sync-to-users", verifyToken, requireAdmin, async (req, res) => {
  try {
    const timetables = await Timetable.find().populate("schedule.subjectId");

    for (const tt of timetables) {
      const cls = await ClassModel.findById(tt.classId);
      if (!cls) continue;

      const userSchedule = (tt.schedule || []).map((s: any) => ({
        day: s.day,
        subject:
          (s.subjectId && (s.subjectId.name || s.subjectId.title)) ||
          String(s.subjectId),
        startTime: s.startTime,
        endTime: s.endTime,
      }));

      const clsStudents = (cls.studentIds || []).map((id: any) => id);
      if (clsStudents.length > 0) {
        await User.updateMany(
          { _id: { $in: clsStudents } },
          { $set: { schedule: userSchedule } },
        );
      }
      // (do not sync to teacher user in backfill — keep original behavior)
    }

    res.json({ success: true, message: "Sync completed" });
  } catch (err) {
    console.error("sync-to-users error:", err);
    res
      .status(500)
      .json({ success: false, message: "Sync failed", error: err });
  }
});
