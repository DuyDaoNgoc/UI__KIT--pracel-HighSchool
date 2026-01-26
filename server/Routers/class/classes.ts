import { Router, Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import ClassModel from "../../models/Class";
import TeacherModel from "../../models/teacherModel"; // thêm import TeacherModel
import StudentModel from "../../models/Student"; // import StudentModel để add student đúng
import { verifyToken, checkRole } from "../../middleware/authMiddleware";
import { assignTeacherToClass } from "../../controllers/admin/class/assignTeacherToClass";

const router = Router();

/**
 * 🏫 GET: Lấy toàn bộ lớp
 * Route: GET /api/classes
 */
// Chỉ sửa đoạn GET /
router.get("/", async (req: Request, res: Response) => {
  try {
    // Lấy tất cả lớp và populate teacherId + subjectTeachers
    const classes = await ClassModel.find()
      .populate("teacherId", "_id username email")
      .populate({
        path: "subjectTeachers.teacherId",
        select: "_id username email",
      })
      .populate({
        path: "subjectTeachers.subjectId",
        select: "_id name",
      })
      .lean();

    // Lấy tất cả studentIds (hỗ trợ cả object {_id,..} và raw ObjectId)
    const allStudentRefs = classes.flatMap((cls) =>
      (cls.studentIds || []).map((s: any) => (s && s._id ? s._id : s)),
    );

    // Query tất cả học sinh
    const students = await StudentModel.find({ _id: { $in: allStudentRefs } })
      .select(
        "_id studentId name username dob address residence phone grade classLetter class major schoolYear email createdAt",
      )
      .lean();

    // Map học sinh vào lớp
    const classesWithStudents = classes.map((cls) => {
      const clsStudents = (cls.studentIds || [])
        .map((s: any) => {
          // find student by matching _id (if s is object) or by comparing raw id
          const sid = s && s._id ? String(s._id) : String(s);
          const student = students.find((st) => String(st._id) === sid);
          if (student && student.studentId && student.name) {
            return {
              _id: student._id,
              studentId: student.studentId,
              name: student.name || student.username,
              dob: student.dob || null,
              address: student.address || "",
              residence: student.residence || "",
              phone: student.phone || "",
              grade: student.grade || cls.grade,
              classLetter: student.classLetter || cls.classLetter,
              schoolYear: student.schoolYear || cls.schoolYear,
              major: student.major || cls.major,
              email: student.email || "",
              teacherName: cls.teacherName || "Chưa gán",
              createdAt: student.createdAt || null,
            };
          }
          return null;
        })
        .filter((s) => s !== null);

      return {
        _id: cls._id,
        classCode: cls.classCode,
        grade: cls.grade,
        classLetter: cls.classLetter,
        major: cls.major,
        schoolYear: cls.schoolYear,
        teacherId: cls.teacherId || null,
        teacherName: cls.teacherName || "Chưa gán",
        subjectTeachers: cls.subjectTeachers || [],
        createdAt: cls.createdAt || null,
        students: clsStudents,
      };
    });

    return res.status(200).json({ success: true, data: classesWithStudents });
  } catch (err) {
    console.error("⚠️ fetch classes error:", err);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách lớp",
    });
  }
});

/**
 * 🏫 GET: Lấy lớp dạy của giáo viên hiện tại
 * Route: GET /api/classes/my-classes
 * Yêu cầu: authenticated + teacher role
 */
router.get(
  "/my-classes",
  verifyToken,
  checkRole(["teacher"]),
  async (req: any, res: Response) => {
    try {
      // Debug: Log the entire request user object
      console.log("🔍 Full req.user object:", req.user);

      // JWT token stores the id as 'id', not '_id'
      const teacherId = req.user?.id;
      console.log(
        "📚 Fetching classes for teacher ID:",
        teacherId,
        "(type: " + typeof teacherId + ")",
      );

      if (!teacherId) {
        console.error("❌ No teacher ID found in token");
        return res.status(401).json({ message: "Unauthorized: No teacher ID" });
      }

      // First, let's see ALL classes in the database
      console.log("🔍 DEBUG: Fetching ALL classes to understand structure...");
      const allClasses = await ClassModel.find()
        .select("_id classCode teacherId subjectTeachers.teacherId")
        .lean();
      console.log("📊 All classes in DB:", allClasses.length, "total");
      allClasses.forEach((cls) => {
        console.log(`  - Class ${cls.classCode}:`, {
          teacherId: cls.teacherId,
          teacherIdType: typeof cls.teacherId,
          subjectTeachersCount: (cls.subjectTeachers || []).length,
        });
      });

      // 🔒 Query: lớp mà giáo viên là chủ nhiệm HOẶC là giáo viên bộ môn
      // Prepare possible teacher identifiers: token user id and teacher code -> TeacherModel._id
      const possibleTeacherIds: any[] = [];
      if (teacherId) possibleTeacherIds.push(teacherId);

      // If token includes a teacher code (e.g., GV00002), try resolving to TeacherModel._id
      try {
        const tokenTeacherCode = req.user?.teacherId;
        if (tokenTeacherCode) {
          const resolvedTeacher = await TeacherModel.findOne({
            teacherId: String(tokenTeacherCode),
          })
            .select("_id teacherId")
            .lean();
          if (resolvedTeacher && resolvedTeacher._id) {
            possibleTeacherIds.push(String(resolvedTeacher._id));
            console.log(
              "🔍 Resolved token teacher code to TeacherModel._id:",
              resolvedTeacher._id,
              "(code:",
              resolvedTeacher.teacherId,
              ")",
            );
          }
        }
      } catch (e) {
        console.warn("Could not resolve teacher code to TeacherModel:", e);
      }

      // Deduplicate
      const uniqIds = Array.from(new Set(possibleTeacherIds.map(String)));

      // Query classes where teacherId or subjectTeachers.teacherId matches any of the possible ids
      const classes = await ClassModel.find({
        $or: [
          { teacherId: { $in: uniqIds } },
          { "subjectTeachers.teacherId": { $in: uniqIds } },
        ],
      })
        .populate("teacherId", "_id username email")
        .populate({
          path: "subjectTeachers.teacherId",
          select: "_id username email",
        })
        .populate({
          path: "subjectTeachers.subjectId",
          select: "_id name",
        })
        .lean();

      console.log(
        `✅ Found ${classes.length} classes for teacher identifiers:`,
        uniqIds,
      );

      console.log(`📋 Final result: ${classes.length} classes`);

      // Lấy tất cả studentIds
      const allStudentRefs = classes.flatMap((cls) =>
        (cls.studentIds || []).map((s: any) => (s && s._id ? s._id : s)),
      );

      // Query tất cả học sinh
      const students = await StudentModel.find({ _id: { $in: allStudentRefs } })
        .select(
          "_id studentId name username dob address residence phone grade classLetter class major schoolYear email createdAt",
        )
        .lean();

      // Map học sinh vào lớp
      const classesWithStudents = classes.map((cls) => {
        const clsStudents = (cls.studentIds || [])
          .map((s: any) => {
            const sid = s && s._id ? String(s._id) : String(s);
            const student = students.find((st) => String(st._id) === sid);
            if (student && student.studentId && student.name) {
              return {
                _id: student._id,
                studentId: student.studentId,
                name: student.name || student.username,
                dob: student.dob || null,
                address: student.address || "",
                residence: student.residence || "",
                phone: student.phone || "",
                grade: student.grade || cls.grade,
                classLetter: student.classLetter || cls.classLetter,
                schoolYear: student.schoolYear || cls.schoolYear,
                major: student.major || cls.major,
                email: student.email || "",
                teacherName: cls.teacherName || "Chưa gán",
                createdAt: student.createdAt || null,
              };
            }
            return null;
          })
          .filter((s) => s !== null);

        return {
          _id: cls._id,
          classCode: cls.classCode,
          grade: cls.grade,
          classLetter: cls.classLetter,
          major: cls.major,
          schoolYear: cls.schoolYear,
          teacherId: cls.teacherId || null,
          teacherName: cls.teacherName || "Chưa gán",
          subjectTeachers: cls.subjectTeachers || [],
          createdAt: cls.createdAt || null,
          students: clsStudents,
        };
      });

      return res.status(200).json({ success: true, data: classesWithStudents });
    } catch (err) {
      console.error("⚠️ fetch my-classes error:", err);
      return res.status(500).json({
        success: false,
        message: "Không thể lấy danh sách lớp dạy",
      });
    }
  },
);

/**
 * 🗑️ DROP collection (chỉ dùng lần đầu để fix schema)
 * Route: DELETE /api/classes/cleanup/drop
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const classId = id as string;
    const cls = await ClassModel.findByIdAndDelete(classId);
    if (!cls) {
      return res.status(404).json({
        success: false,
        message: "Lớp không tồn tại",
      });
    }
    return res.json({ success: true, message: "Đã xóa lớp" });
  } catch (err: any) {
    console.error(" delete class error:", err);
    return res.status(500).json({
      success: false,
      message: "Không thể xóa lớp",
    });
  }
});

/**
 * ✅ Temporary endpoint: remove/clear collection validator via collMod (use once)
 * Route: POST /api/classes/cleanup/disable-validator
 */
router.post(
  "/cleanup/disable-validator",
  async (req: Request, res: Response) => {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        console.error("⚠️ MongoDB connection db is undefined");
        return res.status(500).json({ success: false, error: "DB not ready" });
      }
      await db.command({
        collMod: "classes",
        validator: {},
        validationLevel: "off",
      });
      console.log(" classes validator cleared via collMod");
      return res.json({ success: true, message: "Validator cleared" });
    } catch (err: any) {
      console.error(" failed to clear validator:", err);
      return res
        .status(500)
        .json({ success: false, error: err.message || err });
    }
  },
);

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const classId = id as string;
    const updated = await ClassModel.findByIdAndUpdate(classId, req.body, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Lớp không tồn tại",
      });
    }
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error(" update class error:", err);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật lớp",
    });
  }
});

/**
 * 🏫 POST: Tạo lớp mới
 * Route: POST /api/classes/create
 */
router.post("/create", async (req: Request, res: Response) => {
  try {
    const { grade, schoolYear, classLetter, major } = req.body;
    console.log("📥 Request body:", req.body);
    if (!grade || !schoolYear || !classLetter || !major) {
      console.warn(" Thiếu dữ liệu đầu vào:", req.body);
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin lớp (grade, schoolYear, classLetter, major)",
      });
    }
    const majorAbbrev = major
      .split(/\s+/)
      .map((w: string) => w[0]?.toUpperCase() || "")
      .join("");
    const classCode = `${grade}${classLetter}${majorAbbrev}`;
    console.log(" Generated classCode:", classCode);
    const existed = await ClassModel.findOne({ classCode });
    if (existed) {
      return res
        .status(400)
        .json({ success: false, message: "Lớp đã tồn tại (trùng classCode)" });
    }
    const cls = new ClassModel({
      grade,
      schoolYear,
      classLetter,
      major,
      classCode,
      teacherId: null,
      teacherName: "",
      studentIds: [],
    });
    try {
      await cls.save();
      console.log(" Class created:", cls);
      return res.status(201).json({ success: true, data: cls });
    } catch (saveErr: any) {
      const msg = (saveErr && saveErr.message) || "";
      const isValidationFailure =
        msg.includes("Document failed validation") || saveErr.code === 121;
      if (isValidationFailure) {
        console.warn(
          " Validation blocked insert, retrying with bypassDocumentValidation",
        );
        const raw = {
          grade,
          schoolYear,
          classLetter,
          major,
          classCode,
          teacherId: null,
          teacherName: "",
          studentIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await ClassModel.collection.insertOne(raw, {
          bypassDocumentValidation: true,
        });
        const created = await ClassModel.findById(result.insertedId);
        console.log(" Class created via bypass:", created);
        return res.status(201).json({ success: true, data: created });
      }
      throw saveErr;
    }
  } catch (err: any) {
    console.error(" create class error:", err.message || err);
    console.error(" Stack:", err.stack || "");
    return res.status(500).json({
      success: false,
      message: "Không thể tạo lớp",
      error: err.message || err,
    });
  }
});

/* keep other routes unchanged (assign, assign-teacher, add-student) */
router.post("/assign", assignTeacherToClass);

router.post(
  "/:classCode/assign-teacher",
  async (req: Request, res: Response) => {
    try {
      const { classCode } = req.params;
      const { teacherId } = req.body;
      if (!teacherId)
        return res
          .status(400)
          .json({ success: false, message: "Thiếu teacherId" });
      const cls = await ClassModel.findOne({ classCode });
      if (!cls)
        return res
          .status(404)
          .json({ success: false, message: "Lớp không tồn tại" });
      const teacher = await TeacherModel.findById(teacherId as string);
      cls.teacherId = new mongoose.Types.ObjectId(teacherId as string);
      cls.teacherName = teacher?.name || "";
      await cls.save();
      console.log("Teacher assigned:", classCode, cls.teacherName);
      return res.status(200).json({ success: true, data: cls });
    } catch (err: any) {
      console.error("⚠️ assign teacher error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Gán giáo viên thất bại" });
    }
  },
);

router.post("/:classCode/add-student", async (req: Request, res: Response) => {
  try {
    const { classCode } = req.params;
    const { studentId } = req.body;

    console.log(
      "📥 [add-student] classCode:",
      classCode,
      "studentId:",
      studentId,
    );

    if (!studentId)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu studentId" });

    const cls = await ClassModel.findOne({ classCode });
    if (!cls)
      return res
        .status(404)
        .json({ success: false, message: "Lớp chưa tồn tại" });

    // Tìm học sinh theo studentId
    const student = await StudentModel.findOne({ studentId });
    console.log("🔍 Found student:", student?._id, "for studentId:", studentId);

    if (!student) {
      console.warn("⚠️ Student not found for studentId:", studentId);
      return res
        .status(404)
        .json({ success: false, message: "Học sinh không tồn tại" });
    }

    // Kiểm tra đã có trong lớp chưa
    const alreadyInClass = cls.studentIds.some(
      (s: any) => s?.equals(student._id) || String(s) === String(student._id),
    );

    console.log("📋 Class studentIds:", cls.studentIds);
    console.log("📋 Student ID:", student._id, "studentId:", studentId);
    console.log("📋 Already in class?", alreadyInClass);

    if (alreadyInClass)
      return res
        .status(400)
        .json({ success: false, message: "Học sinh đã có trong lớp" });

    // Push student ID to array
    cls.studentIds.push(student._id as mongoose.Types.ObjectId);

    await cls.save();

    return res.status(200).json({ success: true, data: cls });
  } catch (err: any) {
    console.error("❌ [add-student] error:", err?.message || err);
    return res.status(500).json({
      success: false,
      message: "Thêm học sinh thất bại",
      error: err?.message,
    });
  }
});

/**
 * 🧑‍🏫 POST: Gán giáo viên cho nhiều lớp cùng lúc
 * Route: POST /api/classes/assign-teacher-bulk
 * Body:
 * {
 *   teacherId: string,
 *   assignments: [
 *     { classCode: string, type: "homeroom" | "subject" }
 *   ]
 * }
 */
router.post("/assign-teacher-bulk", async (req: Request, res: Response) => {
  try {
    const { teacherId, assignments } = req.body;
    if (!teacherId || !Array.isArray(assignments) || assignments.length === 0)
      return res.status(400).json({
        success: false,
        message: "Thiếu teacherId hoặc danh sách lớp",
      });
    const teacher = await TeacherModel.findById(teacherId as string);
    const teacherName = teacher?.name || "";
    const results: any[] = [];

    // 🆕 Track all assigned classes for this teacher to update teacher.assignedClass
    const assignedClasses: any[] = [];

    for (const assign of assignments) {
      const { classCode, type } = assign;
      const cls = await ClassModel.findOne({ classCode });
      if (!cls) {
        results.push({
          classCode,
          success: false,
          message: "Lớp không tồn tại",
        });
        continue;
      }

      // 🆕 Track this assignment
      assignedClasses.push({
        grade: cls.grade,
        classLetter: cls.classLetter,
        major: cls.major,
        schoolYear: cls.schoolYear,
        classCode: cls.classCode,
        role: type,
      });

      if (type === "homeroom") {
        cls.teacherId = new mongoose.Types.ObjectId(teacherId as string);
        cls.teacherName = teacherName;
      } else if (type === "subject") {
        if (!cls.subjectTeachers) cls.subjectTeachers = [];
        // Expect assign.subject to be a Subject _id (string). Fetch subject name for display.
        const subjectId = assign.subject as string;
        let subjectName = "unknown";
        try {
          const SubjectModel = require("../../models/Subject").default;
          const subjDoc = await SubjectModel.findById(subjectId).lean();
          if (subjDoc) subjectName = subjDoc.name;
        } catch (e) {
          console.warn("⚠️ Không thể lấy Subject để gán lớp:", e);
        }

        if (
          !cls.subjectTeachers.some(
            (t: any) =>
              String(t.teacherId) === String(teacherId) &&
              String(t.subjectId) === String(subjectId),
          )
        ) {
          cls.subjectTeachers.push({
            subjectId: new mongoose.Types.ObjectId(subjectId),
            subjectName,
            teacherId: new mongoose.Types.ObjectId(teacherId as string),
            teacherName,
          });
        }
      }
      await cls.save();
      results.push({ classCode, success: true });
    }

    // 🆕 Update teacher.assignedClass (MERGE logic: keep old subject, remove old homeroom if new one added)
    if (teacher && assignedClasses.length > 0) {
      // Check if any new assignment is homeroom
      const hasNewHomeroom = assignedClasses.some((a) => a.role === "homeroom");

      // Start with existing classes
      let merged: any[] = teacher.assignedClass || [];

      // If assigning new homeroom, remove old homeroom first
      if (hasNewHomeroom) {
        merged = merged.filter((cls) => cls.role !== "homeroom");
      }

      // Add new assignments (avoid duplicates by classCode)
      for (const newAssign of assignedClasses) {
        const exists = merged.some(
          (cls) => cls.classCode === newAssign.classCode,
        );
        if (!exists) {
          merged.push(newAssign);
        } else {
          // If class already exists, update role (in case changing from subject to homeroom)
          const idx = merged.findIndex(
            (cls) => cls.classCode === newAssign.classCode,
          );
          if (idx >= 0) {
            merged[idx] = newAssign;
          }
        }
      }

      teacher.assignedClass = merged;
      await teacher.save();
      console.log(
        `✅ Updated teacher ${teacherId} assignedClass (merged):`,
        merged,
      );

      // 🆕 Auto-sync to users collection
      try {
        const { syncTeacherToUser } = require("../../utils/syncUserData");
        await syncTeacherToUser(
          teacher.toObject ? teacher.toObject() : teacher,
        );
        console.log(`✅ Synced teacher ${teacherId} to users collection`);
      } catch (err) {
        console.warn(
          `⚠️ Could not sync teacher to users after class assignment:`,
          err,
        );
      }
    }

    return res
      .status(200)
      .json({ success: true, message: "Xếp giáo viên hoàn tất", results });
  } catch (err: any) {
    console.error("⚠️ assign teachers bulk error:", err);
    return res.status(500).json({
      success: false,
      message: "Xếp giáo viên thất bại",
      error: err.message || err,
    });
  }
});

export default router;
