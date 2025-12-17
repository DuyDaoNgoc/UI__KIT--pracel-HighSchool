import express from "express";
import Grade from "../../models/Grade";
import Student from "../../models/Student";
import Subject from "../../models/Subject";
import ClassModel from "../../models/Class";
import GradeLock from "../../models/GradeLock";
import User from "../../models/User";
import { verifyToken, checkRole } from "../../middleware/authMiddleware";
import { syncStudentGradesToUser } from "../../utils/syncUserData";
import { getIo } from "../../utils/socketio";

const router = express.Router();

// Lấy danh sách điểm
router.get("/", verifyToken, async (req, res) => {
  try {
    const { subjectId, classId, studentId } = req.query;
    const filter: any = {};

    if (subjectId) filter.subjectId = subjectId;
    if (classId) filter.classId = classId;
    if (studentId) filter.studentId = studentId;

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
      const { grades: gradesData } = req.body;

      if (!Array.isArray(gradesData)) {
        return res.status(400).json({ message: "Grades must be an array" });
      }

      const savedGrades = [];
      const studentIds = new Set<string>();

      for (const gradeData of gradesData) {
        const { studentId, subjectId, classId, score } = gradeData;

        // Kiểm tra khóa điểm
        const lock = await GradeLock.findOne({ classId, subjectId });
        if (lock?.isLocked) {
          return res.status(403).json({
            message: "Điểm của môn học này đã bị khóa, không thể chỉnh sửa",
          });
        }

        // Validate
        if (score < 0 || score > 10) {
          return res.status(400).json({ message: "Điểm phải từ 0 đến 10" });
        }

        const student = await Student.findById(studentId);
        const subject = await Subject.findById(subjectId);
        const cls = await ClassModel.findById(classId);

        if (!student || !subject || !cls) {
          return res
            .status(404)
            .json({ message: "Invalid student, subject, or class" });
        }

        // Tìm hoặc tạo điểm
        let grade = await Grade.findOne({ studentId, subjectId, classId });
        if (!grade) {
          grade = new Grade({ studentId, subjectId, classId, score });
        } else {
          grade.score = score;
        }

        await grade.save();
        savedGrades.push(grade);
        studentIds.add(String(studentId));
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

      res.status(200).json({ success: true, grades: savedGrades });
    } catch (err) {
      console.error(err);
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
    const scores = grades.map((g) => g.score);
    const averageGrade = scores.reduce((a, b) => a + b, 0) / totalStudents;

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

      // Fetch class, subject, and teacher info
      const cls = await ClassModel.findById(classId);
      const subject = await Subject.findById(subjectId);
      const teacher = teacherId ? await User.findById(teacherId) : null;

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
        const score = gradesData[student._id];
        if (score !== undefined && score !== null) {
          gradeReport.gradedStudents.push({
            studentId: student.studentId,
            name: student.name,
            score: score,
          });
        }
      }

      const io = getIo();

      // ✅ SEND TO STUDENTS
      if (sendToStudents && io) {
        for (const studentData of gradeReport.gradedStudents) {
          const student = await Student.findOne({
            studentId: studentData.studentId,
          }).populate("userId");

          if (student?.userId) {
            const notification = {
              type: "grade_submitted",
              title: `📝 Điểm ${subject.name} được cập nhật`,
              message: `Thầy/cô ${teacher?.name} vừa cập nhật điểm ${subject.name} của bạn: ${studentData.score}/10`,
              score: studentData.score,
              subject: subject.name,
              class: cls.classCode,
              teacher: teacher?.name,
              timestamp: new Date(),
            };

            // Emit to student via socket
            if (io) {
              io.to(`user:${student.userId._id}`).emit(
                "notification",
                notification,
              );
              console.log(
                `📨 Grade notification sent to student ${student.studentId}`,
              );
            }

            // Save notification to database (optional)
            try {
              await User.findByIdAndUpdate(student.userId._id, {
                $push: {
                  notifications: notification,
                },
              });
            } catch (e) {
              console.warn("Could not save notification to DB:", e);
            }
          }
        }
      }

      // ✅ SEND TO ADMIN
      if (sendToAdmin && io) {
        const adminNotification = {
          type: "grade_report_submitted",
          title: `📊 Báo cáo điểm từ ${teacher?.name}`,
          message: `${teacher?.name} vừa cập nhật ${gradeReport.gradedStudents.length}/${gradeReport.totalStudents} học sinh lớp ${cls.classCode} môn ${subject.name}`,
          report: gradeReport,
          timestamp: new Date(),
        };

        // Get all admins
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          io.to(`user:${admin._id}`).emit("notification", adminNotification);
          console.log(`📨 Grade report sent to admin ${admin.email}`);

          // Save notification to admin's database
          try {
            await User.findByIdAndUpdate(admin._id, {
              $push: {
                notifications: adminNotification,
              },
            });
          } catch (e) {
            console.warn("Could not save admin notification to DB:", e);
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
