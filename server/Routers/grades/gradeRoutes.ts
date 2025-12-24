import express from "express";
import Grade from "../../models/Grade";
import Student from "../../models/Student";
import Subject from "../../models/Subject";
import TeacherModel from "../../models/teacherModel";
import ClassModel from "../../models/Class";
import GradeLock from "../../models/GradeLock";
import User from "../../models/User";
import {
  verifyToken,
  checkRole,
  AuthRequest,
} from "../../middleware/authMiddleware";
import { syncStudentGradesToUser } from "../../utils/syncUserData";
import { getIo } from "../../utils/socketio";

const router = express.Router();

// Lấy danh sách điểm
router.get("/", verifyToken, async (req, res) => {
  try {
    const { subjectId, classId, studentId } = req.query;
    const filter: any = {};

    // Helper: treat 24-hex strings as ObjectId, otherwise try to resolve
    const looksLikeObjectId = (v: any) =>
      typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);

    // resolve studentId if provided: allow external student code (e.g. 26C26667)
    if (studentId) {
      const sid = String(studentId);
      if (looksLikeObjectId(sid)) {
        filter.studentId = sid;
      } else {
        // try to find Student by studentId code; if not found, return empty
        try {
          const s = await Student.findOne({ studentId: sid }).select("_id");
          if (s && s._id) filter.studentId = s._id;
          else {
            // no matching student -> return empty list (not server error)
            return res.status(200).json({ data: [] });
          }
        } catch (e) {
          console.warn("Error resolving studentId query param:", sid, e);
          return res.status(200).json({ data: [] });
        }
      }
    }

    if (classId) {
      const cid = String(classId);
      if (looksLikeObjectId(cid)) filter.classId = cid;
      else {
        const c = await ClassModel.findOne({ classCode: cid }).select("_id");
        if (c && c._id) filter.classId = c._id;
      }
    }

    if (subjectId) {
      const sub = String(subjectId);
      if (looksLikeObjectId(sub)) filter.subjectId = sub;
      else {
        const s = await Subject.findOne({ name: sub }).select("_id");
        if (s && s._id) filter.subjectId = s._id;
      }
    }

    const grades = await Grade.find(filter)
      .populate("studentId")
      .populate("subjectId")
      .populate("classId");

    res.status(200).json({ data: grades });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Nhập điểm hàng loạt (Giáo viên)
router.post(
  "/batch",
  verifyToken,
  checkRole(["teacher", "admin"]),
  async (req, res) => {
    try {
      console.log("📝 [/grades/batch] Request received");
      const gradesData: any[] = req.body?.grades || [];
      const authReq = req as AuthRequest;
      const requestUser = authReq.user;

      // Normalize token identifiers: token uses `id` (from login), but
      // some code checks `._id` or `teacherId`. Build a list of possible
      // identifiers to compare against class/subject teacher refs.
      const tokenIds = [
        requestUser?.id,
        (requestUser as any)?._id,
        (requestUser as any)?.teacherId,
      ]
        .filter(Boolean)
        .map(String);
      console.log(
        "🔍 [/grades/batch] requestUser and tokenIds:",
        requestUser,
        tokenIds,
      );

      if (!Array.isArray(gradesData)) {
        console.error("❌ Grades not an array");
        return res.status(400).json({ message: "Grades must be an array" });
      }

      console.log("📊 Processing", gradesData.length, "grade entries");

      // 🔒 AUTHORIZATION CHECK for teachers
      if (requestUser?.role === "teacher") {
        // Check if teacher is authorized for this class/subject
        if (gradesData.length > 0) {
          const { classId, subjectId } = gradesData[0];

          const cls = await ClassModel.findById(classId);
          if (!cls) {
            console.error("❌ Class not found:", classId);
            return res.status(404).json({ message: "Class not found" });
          }

          // Check if teacher is homeroom or subject teacher
          let clsTeacherId =
            (cls.teacherId && (cls.teacherId._id || cls.teacherId)) || null;
          let isHomeroom = tokenIds.includes(String(clsTeacherId));

          // If class top-level teacherId is an ObjectId pointing to Teacher doc,
          // try resolving to teacher code or linked User._id as a fallback.
          if (!isHomeroom && clsTeacherId) {
            try {
              const maybeId = String(clsTeacherId);
              if (/^[0-9a-fA-F]{24}$/.test(maybeId)) {
                const tdoc = await TeacherModel.findById(maybeId).lean();
                if (tdoc) {
                  if (
                    tdoc.teacherId &&
                    tokenIds.includes(String(tdoc.teacherId))
                  ) {
                    isHomeroom = true;
                  }
                  // try linked User via teacherRef or teacherId
                  if (!isHomeroom) {
                    const linkedUser = await User.findOne({
                      $or: [
                        { teacherRef: tdoc._id },
                        { teacherId: tdoc.teacherId },
                      ],
                    }).lean();
                    if (
                      linkedUser &&
                      tokenIds.includes(String(linkedUser._id))
                    ) {
                      isHomeroom = true;
                    }
                  }
                }
              }
            } catch (e) {
              console.warn(
                "Could not resolve class teacherId to Teacher doc:",
                e,
              );
            }
          }

          // Subject teacher check with fallback resolution
          const isSubjectTeacher = !!(await (async () => {
            const arr = cls.subjectTeachers || [];
            for (const st of arr) {
              const stTeacherId = st.teacherId?._id || st.teacherId || null;
              let teacherMatch = tokenIds.includes(String(stTeacherId));
              const subjectMatch =
                String(st.subjectId?._id || st.subjectId) === String(subjectId);

              if (!teacherMatch && stTeacherId) {
                try {
                  const maybe = String(stTeacherId);
                  if (/^[0-9a-fA-F]{24}$/.test(maybe)) {
                    const tdoc = await TeacherModel.findById(maybe).lean();
                    if (tdoc) {
                      if (
                        tdoc.teacherId &&
                        tokenIds.includes(String(tdoc.teacherId))
                      ) {
                        teacherMatch = true;
                      }
                      if (!teacherMatch) {
                        const linkedUser = await User.findOne({
                          $or: [
                            { teacherRef: tdoc._id },
                            { teacherId: tdoc.teacherId },
                          ],
                        }).lean();
                        if (
                          linkedUser &&
                          tokenIds.includes(String(linkedUser._id))
                        ) {
                          teacherMatch = true;
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.warn(
                    "Could not resolve subject teacherId to Teacher doc:",
                    e,
                  );
                }
              }

              if (teacherMatch && subjectMatch) return true;
            }
            return false;
          })());

          if (!isHomeroom && !isSubjectTeacher) {
            console.error("❌ Teacher not authorized for this class/subject");
            return res.status(403).json({
              message: "Bạn không có quyền nhập điểm cho lớp/môn học này",
            });
          }
        }
      }

      const savedGrades = [];
      const studentIds = new Set<string>();
      const failedEntries: any[] = [];

      for (const gradeData of gradesData) {
        try {
          const { studentId, subjectId, classId, grades } = gradeData as any;

          // log thô để debug khi dữ liệu không hợp lệ
          console.debug(
            "[/grades/batch] processing gradeData:",
            JSON.stringify(gradeData),
          );

          // Kiểm tra khóa điểm
          const lock = await GradeLock.findOne({ classId, subjectId });
          if (lock?.isLocked) {
            console.warn("Grades locked for subject", subjectId);
            failedEntries.push({ gradeData, reason: "locked" });
            continue;
          }

          // Validate grades array
          if (!Array.isArray(grades) || grades.length === 0) {
            console.warn("Grades array empty or invalid", { gradeData });
            failedEntries.push({ gradeData, reason: "invalid_grades_array" });
            continue;
          }

          let invalidScore = false;
          for (const g of grades as any[]) {
            const sc = (g as any).score;
            if (sc < 0 || sc > 10) {
              invalidScore = true;
              break;
            }
          }
          if (invalidScore) {
            console.warn("Invalid score in grades", { gradeData });
            failedEntries.push({ gradeData, reason: "invalid_score" });
            continue;
          }

          // Hỗ trợ dạng studentId/subjectId/classId có thể là object chứa _id hoặc mã
          const extractId = (v: any): string | null => {
            if (v == null) return null;
            if (typeof v === "string") {
              // try to unwrap quoted JSON
              const trimmed = v.trim();
              if (
                (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
                (trimmed.startsWith("'") && trimmed.endsWith("'"))
              ) {
                const inner = trimmed.slice(1, -1);
                if (inner && !inner.includes("[object Object]")) return inner;
              }
              return v;
            }
            if (typeof v === "number") return String(v);
            if (typeof v === "object") {
              const tryKeys = [
                "_id",
                "id",
                "studentId",
                "classId",
                "subjectId",
                "userId",
                "student",
                "user",
              ];
              for (const k of tryKeys) {
                const val = (v as any)[k];
                if (!val) continue;
                if (typeof val === "string") return val;
                if (typeof val === "object" && (val as any)._id)
                  return String((val as any)._id);
                if (typeof val === "number") return String(val);
              }
              if ((v as any)._id) return String((v as any)._id);
              if ((v as any).student && (v as any).student._id)
                return String((v as any).student._id);
              if ((v as any).userId && (v as any).userId._id)
                return String((v as any).userId._id);
            }
            return null;
          };

          const looksLikeObjectId = (v: any) =>
            typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);

          const resolvedStudentId = extractId(studentId);
          const resolvedSubjectId = extractId(subjectId);
          const resolvedClassId = extractId(classId);

          let student = null;
          if (resolvedStudentId && looksLikeObjectId(resolvedStudentId)) {
            student = await Student.findById(String(resolvedStudentId));
          } else if (resolvedStudentId) {
            student = await Student.findOne({
              studentId: String(resolvedStudentId),
            });
          }

          let subject = null;
          if (resolvedSubjectId && looksLikeObjectId(resolvedSubjectId)) {
            subject = await Subject.findById(String(resolvedSubjectId));
          } else if (resolvedSubjectId) {
            subject = await Subject.findOne({
              name: String(resolvedSubjectId),
            });
          }

          let cls = null;
          if (resolvedClassId && looksLikeObjectId(resolvedClassId)) {
            cls = await ClassModel.findById(String(resolvedClassId));
          } else if (resolvedClassId) {
            cls = await ClassModel.findOne({
              classCode: String(resolvedClassId),
            });
          }

          if (!student || !subject || !cls) {
            console.warn(
              "Skipping invalid gradeData (student/subject/class not found)",
              {
                gradeData,
                resolvedStudentId,
                resolvedSubjectId,
                resolvedClassId,
              },
            );
            failedEntries.push({ gradeData, reason: "not_found" });
            continue;
          }

          // Tìm hoặc tạo điểm
          let grade = await Grade.findOne({
            studentId: student._id,
            subjectId: subject._id,
            classId: cls._id,
          });
          if (!grade) {
            grade = new Grade({
              studentId: student._id,
              subjectId: subject._id,
              classId: cls._id,
              grades,
            });
          } else {
            grade.grades = grades;
          }

          await grade.save();
          savedGrades.push(grade);
          studentIds.add(String(student._id));
        } catch (e) {
          console.error("Error processing gradeData entry:", gradeData, e);
          failedEntries.push({
            gradeData,
            reason: "exception",
            error: e?.message || e,
          });
          continue;
        }
      }

      // ✅ Sync grades to User collection for all affected students
      for (const studentId of studentIds) {
        await syncStudentGradesToUser(studentId);
        try {
          const io = getIo();
          if (io) {
            io.emit("grade:updated", {
              studentId,
              grade: null, // batch endpoint updates many grades; frontend should refetch for this student
              by: null,
              ts: new Date(),
            });
          }
        } catch (e) {
          console.warn("Could not emit grade:updated in batch:", e);
        }
      }

      console.log("✅ Saved", savedGrades.length, "grades");
      res.status(200).json({ success: true, grades: savedGrades });
    } catch (err) {
      console.error("❌ /grades/batch error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

// Thống kê điểm
router.get("/statistics", verifyToken, async (req, res) => {
  try {
    const { classId, subjectId } = req.query;
    const filter: any = {};

    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;

    const grades = await Grade.find(filter);

    if (grades.length === 0) {
      return res.status(200).json({
        data: {
          totalStudents: 0,
          averageGrade: 0,
          excellentCount: 0,
          goodCount: 0,
          fairCount: 0,
          poorCount: 0,
          failCount: 0,
        },
      });
    }

    const totalStudents = grades.length;
    const computeAvg = (g: any) => {
      if (typeof g.averageScore === "number") return g.averageScore;
      if (Array.isArray(g.grades) && g.grades.length > 0)
        return (
          g.grades.reduce((s: number, ge: any) => s + (ge.score || 0), 0) /
          g.grades.length
        );
      return 0;
    };
    const scores = grades.map((g) => computeAvg(g));
    const averageGrade = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const excellentCount = scores.filter((s) => s >= 9).length; // 9-10
    const goodCount = scores.filter((s) => s >= 8 && s < 9).length; // 8-8.9
    const fairCount = scores.filter((s) => s >= 7 && s < 8).length; // 7-7.9
    const poorCount = scores.filter((s) => s >= 5 && s < 7).length; // 5-6.9
    const failCount = scores.filter((s) => s < 5).length; // <5

    res.status(200).json({
      data: {
        totalStudents,
        averageGrade: Math.round(averageGrade * 100) / 100,
        excellentCount,
        goodCount,
        fairCount,
        poorCount,
        failCount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Lấy chi tiết một điểm
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate("studentId")
      .populate("subjectId")
      .populate("classId");

    if (!grade) return res.status(404).json({ message: "Grade not found" });
    res.status(200).json({ data: grade });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Xóa điểm
router.delete(
  "/:id",
  verifyToken,
  checkRole(["teacher", "admin"]),
  async (req, res) => {
    try {
      const grade = await Grade.findByIdAndDelete(req.params.id);
      if (!grade) return res.status(404).json({ message: "Grade not found" });
      res.status(200).json({ message: "Grade deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

// ========== NEW ENDPOINT: Gửi điểm đến học sinh và admin ==========
router.post(
  "/submit-with-notifications",
  verifyToken,
  checkRole(["teacher", "admin"]),
  async (req, res) => {
    try {
      const {
        classId,
        subjectId,
        grades: gradesData,
        sendToStudents = true,
        sendToAdmin = true,
        teacherId,
      } = req.body;

      if (!classId || !subjectId || !gradesData) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: classId, subjectId, grades",
        });
      }

      // Fetch class and subject
      const cls = await ClassModel.findById(classId);
      const subject = await Subject.findById(subjectId);

      // Resolve teacher: `teacherId` payload may be a User._id or a teacher code like 'GV00002'
      const resolveUserByIdentifier = async (ident?: any) => {
        if (!ident) return null;
        const s = String(ident);
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(s);
        if (isObjectId) {
          const u = await User.findById(s).lean();
          if (u) return u;
        }
        // try common lookup fields (teacherId code, email, username)
        const u2 = await User.findOne({
          $or: [{ teacherId: s }, { email: s }, { username: s }],
        }).lean();
        return u2;
      };

      const authReq = req as AuthRequest;
      const requestUser = authReq.user;

      let teacher = null;
      if (teacherId) {
        teacher = await resolveUserByIdentifier(teacherId);
      }
      // fallback: if no teacher passed, try use the auth token user
      if (!teacher && requestUser) {
        teacher = await resolveUserByIdentifier(
          requestUser.id || (requestUser as any)._id || requestUser.teacherId,
        );
      }

      if (!cls || !subject) {
        return res.status(404).json({
          success: false,
          message: "Class or Subject not found",
        });
      }

      // Fetch students in this class
      const students = await Student.find({ classId }).populate("userId");

      // Prepare notification data
      const gradeReport = {
        classCode: cls.classCode,
        subjectName: subject.name,
        teacherName: teacher?.name || "Unknown Teacher",
        gradedStudents: [] as any[],
        totalStudents: students.length,
        gradesSubmittedAt: new Date(),
      };

      // Process each student grade
      for (const student of students) {
        const scoresObj: any = gradesData as any;
        const score =
          scoresObj[String(student._id)] ??
          scoresObj[String(student.studentId)] ??
          scoresObj[student.studentId];
        if (score !== undefined && score !== null) {
          gradeReport.gradedStudents.push({
            studentId: student.studentId,
            name: student.name,
            score: score,
          });
        }
      }

      const io = getIo();

      // ✅ SEND TO STUDENTS (robust: per-student try/catch + guards)
      if (sendToStudents) {
        for (const studentData of gradeReport.gradedStudents) {
          try {
            const student = await Student.findOne({
              studentId: studentData.studentId,
            }).populate("userId");

            // Resolve the User document: prefer populated student.userId, fallback to lookup by studentId or studentRef
            let studentUser = (student as any)?.userId || null;
            if (!studentUser && student) {
              try {
                // try find by studentId on users collection
                studentUser = await User.findOne({
                  studentId: student.studentId,
                }).lean();
                if (!studentUser && student._id) {
                  studentUser = await User.findOne({
                    studentRef: String(student._id),
                  }).lean();
                }
              } catch (e) {
                console.warn(
                  "Error resolving user for student fallback",
                  studentData.studentId,
                  e,
                );
              }
            }

            if (!student || !studentUser) {
              console.warn(
                `Skipping notification: missing student or user for ${studentData.studentId}`,
              );
              continue;
            }

            // If score is an object of grade types, compute average numeric score
            let scoreValue: number | string = studentData.score;
            if (scoreValue && typeof scoreValue === "object") {
              try {
                const numericVals = Object.values(scoreValue)
                  .map((v: any) => (typeof v === "number" ? v : parseFloat(v)))
                  .filter((n: any) => !isNaN(n));
                if (numericVals.length > 0) {
                  const avg =
                    numericVals.reduce((a: number, b: number) => a + b, 0) /
                    numericVals.length;
                  scoreValue = Math.round(avg * 10) / 10;
                } else {
                  scoreValue = JSON.stringify(scoreValue);
                }
              } catch (e) {
                scoreValue = JSON.stringify(scoreValue);
              }
            }

            const notification = {
              type: "grade_submitted",
              title: `📝 Điểm ${subject.name} được cập nhật`,
              message: `Thầy/cô ${teacher?.name || "(không rõ)"} vừa cập nhật điểm ${subject.name} của bạn: ${scoreValue}/10`,
              score: scoreValue,
              subject: subject.name,
              class: cls.classCode,
              teacher: teacher?.name || "Unknown",
              timestamp: new Date(),
            };

            const targetUserId = (studentUser._id || studentUser) as any;

            // Emit via socket if available
            try {
              const ioLocal = getIo();
              if (ioLocal && targetUserId) {
                ioLocal
                  .to(`user:${targetUserId}`)
                  .emit("notification", notification);
                console.log(
                  `📨 Grade notification emitted to student ${student.studentId} -> user:${targetUserId}`,
                );
              } else {
                console.warn(
                  "No io or targetUserId for notification",
                  student.studentId,
                  targetUserId,
                );
              }
            } catch (e) {
              console.warn(
                "Socket emit failed for student:",
                studentData.studentId,
                e,
              );
            }

            // Persist notification to user's document (best-effort)
            try {
              if (targetUserId) {
                // If we have a lean object (from findOne().lean()) targetUserId may be a string _id
                const uid =
                  typeof targetUserId === "string"
                    ? targetUserId
                    : targetUserId._id || targetUserId;
                await User.findByIdAndUpdate(uid, {
                  $push: { notifications: notification },
                });
              }
            } catch (e) {
              console.warn(
                "Could not save notification to DB for student:",
                studentData.studentId,
                e,
              );
            }
          } catch (e) {
            console.error(
              "Error sending notification to student",
              studentData,
              e,
            );
          }
        }
      }

      // ✅ SEND TO ADMIN
      // ✅ SEND TO ADMIN (robust: continue on per-admin errors)
      if (sendToAdmin) {
        const adminNotification = {
          type: "grade_report_submitted",
          title: `Báo cáo điểm từ ${teacher?.name || "(không rõ)"}`,
          message: `${teacher?.name || "(không rõ)"} vừa cập nhật ${gradeReport.gradedStudents.length}/${gradeReport.totalStudents} học sinh lớp ${cls.classCode} môn ${subject.name}`,
          report: gradeReport,
          timestamp: new Date(),
        };

        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          try {
            const adminId = admin._id as any;
            try {
              const ioLocal = getIo();
              if (ioLocal && adminId) {
                ioLocal
                  .to(`user:${adminId}`)
                  .emit("notification", adminNotification);
                console.log(`📨 Grade report emitted to admin ${admin.email}`);
              }
            } catch (e) {
              console.warn("Socket emit failed for admin:", admin.email, e);
            }

            try {
              await User.findByIdAndUpdate(adminId, {
                $push: { notifications: adminNotification },
              });
            } catch (e) {
              console.warn(
                "Could not save admin notification to DB:",
                admin.email,
                e,
              );
            }
          } catch (e) {
            console.error("Error notifying admin", admin.email, e);
          }
        }
      }

      res.status(200).json({
        success: true,
        message: "Grades submitted successfully",
        report: gradeReport,
        notificationsSent: {
          toStudents: sendToStudents,
          toAdmin: sendToAdmin,
          studentsNotified: sendToStudents
            ? gradeReport.gradedStudents.length
            : 0,
          adminsNotified: sendToAdmin
            ? await User.countDocuments({ role: "admin" })
            : 0,
        },
      });
    } catch (err) {
      console.error("submit-with-notifications error:", err);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: err,
      });
    }
  },
);

export default router;
