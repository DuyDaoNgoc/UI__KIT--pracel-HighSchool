// server/Routers/grades.ts
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
// Cho giáo viên gửi yêu cầu cập nhật điểm học sinh
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
      const { studentId, grade } = req.body;
      if (!studentId || grade === undefined) {
        return res.status(400).json({ message: "Missing studentId or grade" });
      }

      const student = await User.findById(studentId);
      if (!student || student.role !== "student") {
        return res.status(404).json({ message: "Student not found" });
      }

      // Kiểm tra giáo viên có quyền sửa học sinh này
      if (!student.teacherId?.equals(teacher._id)) {
        return res
          .status(403)
          .json({ message: "Không được phép sửa học sinh này" });
      }

      // Thêm yêu cầu cập nhật vào grades (hoặc gửi thông báo admin)
      student.grades = student.grades || [];
      student.grades.push({ subject: "Auto-Request", score: grade }); // subject tạm thời
      await student.save();

      res.json({ message: "Yêu cầu cập nhật điểm đã được ghi nhận" });
    } catch (err) {
      console.error("grades/request-update error:", err);
      res.status(500).json({ message: "Failed to request grade update" });
    }
  }
);

export default router;
