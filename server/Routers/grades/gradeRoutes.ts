import express from "express";
import Grade from "../../models/Grade";
import Student from "../../models/Student";
import Subject from "../../models/Subject";
import ClassModel from "../../models/Class";
import GradeLock from "../../models/GradeLock";
import { verifyToken, checkRole } from "../../middleware/authMiddleware";

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

export default router;
