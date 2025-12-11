import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import {
  verifyToken,
  checkRole,
  AuthRequest,
} from "../../middleware/authMiddleware";
import SystemSetting from "../../models/Setting";
import { User } from "../../models/User";

const router = Router();
const SETTINGS_KEY = "gradesLock";

// ==============================
// GET /api/grades/status
// ==============================
router.get("/status", verifyToken, async (_req: Request, res: Response) => {
  try {
    let setting = await SystemSetting.findOne({ key: SETTINGS_KEY });
    if (!setting) {
      setting = new SystemSetting({
        key: SETTINGS_KEY,
        value: { locked: false },
      });
      await setting.save();
    }

    res.json({ locked: !!setting.value?.locked });
  } catch (err) {
    console.error("grades/status error:", err);
    res.status(500).json({ message: "Failed to get lock status" });
  }
});

// ==============================
// POST /api/grades/lock
// ==============================
router.post("/lock", verifyToken, checkRole(["admin"]), async (_req, res) => {
  try {
    const setting = await SystemSetting.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { value: { locked: true } },
      { upsert: true, new: true },
    );
    res.json({ locked: !!setting?.value?.locked });
  } catch (err) {
    console.error("grades/lock error:", err);
    res.status(500).json({ message: "Failed to lock grades" });
  }
});

// ==============================
// POST /api/grades/unlock
// ==============================
router.post("/unlock", verifyToken, checkRole(["admin"]), async (_req, res) => {
  try {
    const setting = await SystemSetting.findOneAndUpdate(
      { key: SETTINGS_KEY },
      { value: { locked: false } },
      { upsert: true, new: true },
    );
    res.json({ locked: !!setting?.value?.locked });
  } catch (err) {
    console.error("grades/unlock error:", err);
    res.status(500).json({ message: "Failed to unlock grades" });
  }
});

// ==============================
// POST /api/grades/toggle-lock
// ==============================
router.post(
  "/toggle-lock",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { locked } = req.body;
      if (locked === undefined)
        return res.status(400).json({ message: "Missing locked value" });

      const setting = await SystemSetting.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { value: { locked: !!locked } },
        { upsert: true, new: true },
      );

      res.json({ locked: !!setting?.value?.locked });
    } catch (err) {
      console.error("grades/toggle-lock error:", err);
      res.status(500).json({ message: "Failed to toggle lock" });
    }
  },
);

// ==============================
// POST /api/grades/request-update
// Giáo viên gửi yêu cầu cập nhật điểm học sinh
// Cập nhật cả Grade collection và User.grades
// ==============================
router.post(
  "/request-update",
  verifyToken,
  checkRole(["teacher"]),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const teacher = authReq.user;

    if (!teacher) return res.status(401).json({ message: "Unauthorized" });

    try {
      const { studentId, grade, subject } = req.body;
      if (!studentId || grade === undefined || !subject) {
        return res
          .status(400)
          .json({ message: "Missing studentId, subject, or grade" });
      }

      // Validate grade score
      if (grade < 0 || grade > 10) {
        return res
          .status(400)
          .json({ message: "Grade must be between 0 and 10" });
      }

      const student = await User.findOne({ studentId });
      if (!student || student.role !== "student") {
        return res.status(404).json({ message: "Student not found" });
      }

      // ✅ SYNC: Update student's grades array (for student to see)
      student.grades = student.grades || [];

      // Check if grade for this subject already exists
      const existingGradeIndex = student.grades.findIndex(
        (g: any) => g.subject === subject,
      );

      if (existingGradeIndex >= 0) {
        // Update existing grade
        student.grades[existingGradeIndex].score = grade;
      } else {
        // Add new grade
        student.grades.push({ subject, score: grade });
      }

      await student.save();

      res.json({
        message: "Điểm đã được cập nhật thành công",
        grade: { subject, score: grade },
        studentId: student.studentId,
      });
    } catch (err) {
      console.error("grades/request-update error:", err);
      res.status(500).json({ message: "Failed to request grade update" });
    }
  },
);

// ==============================
// GET /api/grades/class/:classId
// Lấy thông tin lớp: danh sách học sinh + giáo viên phụ trách + môn học
// ==============================
router.get(
  "/class/:classId",
  verifyToken,
  checkRole(["admin", "teacher"]),
  async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;

      // Import Class model
      const ClassModel = require("../../models/Class").default;

      // Lấy thông tin lớp (bao gồm subjectTeachers)
      const classData = await ClassModel.findById(classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Tìm tất cả học sinh trong lớp
      const students = await User.find({ class: classId, role: "student" });

      // Tìm giáo viên phụ trách lớp
      const teacherIds = students.map((s) => s.teacherId).filter(Boolean);
      const teacher = teacherIds.length
        ? await User.findOne({ role: "teacher", _id: { $in: teacherIds } })
        : null;

      res.json({
        classId,
        gradeLevel: students[0]?.class || "N/A",
        students: students.map((s) => ({
          studentId: s.studentId,
          username: s.username,
          grades: s.grades || [],
        })),
        teacher: teacher
          ? { teacherId: teacher._id.toString(), username: teacher.username }
          : null,
        subjectTeachers: classData.subjectTeachers || [],
      });
    } catch (err) {
      console.error("grades/class error:", err);
      res.status(500).json({ message: "Failed to get class info" });
    }
  },
);

// ==============================
// GET /api/grades/students
// Admin: Lấy danh sách tất cả học sinh với điểm số
// ==============================
router.get(
  "/students",
  verifyToken,
  checkRole(["admin"]),
  async (_req: Request, res: Response) => {
    try {
      const students = await User.find({ role: "student" }).lean();

      res.json({
        data: students.map((s: any) => ({
          studentId: s.studentId,
          username: s.username,
          email: s.email,
          classCode: s.classCode,
          schoolYear: s.schoolYear,
          grades: s.grades || [],
          phone: s.phone,
          address: s.address,
        })),
      });
    } catch (err) {
      console.error("grades/students error:", err);
      res.status(500).json({ message: "Failed to get students" });
    }
  },
);

// ==============================
// GET /api/grades/teachers
// Admin: Lấy danh sách tất cả giáo viên
// ==============================
router.get(
  "/teachers",
  verifyToken,
  checkRole(["admin"]),
  async (_req: Request, res: Response) => {
    try {
      const teachers = await User.find({ role: "teacher" }).lean();

      res.json({
        data: teachers.map((t: any) => ({
          teacherId: t.teacherId,
          username: t.username,
          email: t.email,
          major: t.major,
          phone: t.phone,
          address: t.address,
        })),
      });
    } catch (err) {
      console.error("grades/teachers error:", err);
      res.status(500).json({ message: "Failed to get teachers" });
    }
  },
);

// ==============================
// GET /api/grades/student/:studentId
// Lấy điểm của học sinh (student có thể xem của mình, teacher/admin xem của học sinh)
// ==============================
router.get(
  "/student/:studentId",
  verifyToken,
  checkRole(["student", "teacher", "admin"]),
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;

      const student = await User.findOne({ studentId });
      if (!student || student.role !== "student") {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json({
        studentId: student.studentId,
        username: student.username,
        email: student.email,
        classCode: student.classCode,
        schoolYear: student.schoolYear,
        grades: student.grades || [],
        phone: student.phone,
        address: student.address,
      });
    } catch (err) {
      console.error("grades/student error:", err);
      res.status(500).json({ message: "Failed to get student grades" });
    }
  },
);

export default router;
