import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import {
  verifyToken,
  checkRole,
  AuthRequest,
} from "../middleware/authMiddleware";
import SystemSetting from "../models/Setting";
import { User } from "../models/User";

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
      { upsert: true, new: true }
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
      { upsert: true, new: true }
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
        { upsert: true, new: true }
      );

      res.json({ locked: !!setting?.value?.locked });
    } catch (err) {
      console.error("grades/toggle-lock error:", err);
      res.status(500).json({ message: "Failed to toggle lock" });
    }
  }
);

// ==============================
// POST /api/grades/request-update
// Giáo viên gửi yêu cầu cập nhật điểm học sinh
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

      const student = await User.findOne({ studentId });
      if (!student || student.role !== "student") {
        return res.status(404).json({ message: "Student not found" });
      }

      // Kiểm tra giáo viên có quyền sửa học sinh này
      if (student.teacherId !== teacher._id.toString()) {
        return res
          .status(403)
          .json({ message: "Không được phép sửa học sinh này" });
      }

      // Thêm yêu cầu cập nhật vào grades
      student.grades = student.grades || [];
      student.grades.push({ subject, score: grade });
      await student.save();

      res.json({ message: "Yêu cầu cập nhật điểm đã được ghi nhận" });
    } catch (err) {
      console.error("grades/request-update error:", err);
      res.status(500).json({ message: "Failed to request grade update" });
    }
  }
);

// ==============================
// GET /api/grades/class/:classId
// Lấy thông tin lớp: danh sách học sinh + giáo viên phụ trách
// ==============================
router.get(
  "/class/:classId",
  verifyToken,
  checkRole(["admin", "teacher"]),
  async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;

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
      });
    } catch (err) {
      console.error("grades/class error:", err);
      res.status(500).json({ message: "Failed to get class info" });
    }
  }
);

export default router;
