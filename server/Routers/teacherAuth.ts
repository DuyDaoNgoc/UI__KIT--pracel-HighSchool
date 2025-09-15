// server/Routers/teacherAuth.ts
import { Router, RequestHandler } from "express";
import {
  verifyToken,
  requireTeacher,
  AuthRequest,
} from "../middleware/authMiddleware";
import User from "../models/User"; // Model người dùng (bao gồm học sinh)
import { IUserDocument } from "../types/user"; // Interface đúng
import { registerTeacher } from "../controllers/registerTeacher"; // controller mới

interface IStudentResponse {
  _id: string;
  username: string;
  class?: string;
  lastGrade?: number;
}

interface IGradesLock {
  _id: string;
  locked: boolean;
}

const router = Router();

// ===== Đăng ký giáo viên =====
router.post("/register", async (req, res) => {
  await registerTeacher(req, res);
});

// ===== Lấy danh sách học sinh của giáo viên =====
const getStudents: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const teacher = authReq.user;

  if (!teacher || !teacher._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Tìm học sinh theo teacherId
    const students: IUserDocument[] = await User.find({
      role: "student",
      teacherId: teacher._id.toString(),
    }).select("_id username class grades");

    const response: IStudentResponse[] = students
      .filter((s) => s._id) // loại bỏ trường hợp _id undefined
      .map((s) => ({
        _id: s._id!.toString(),
        username: s.username,
        class: s.class || "Chưa có lớp",
        lastGrade: s.grades?.length
          ? s.grades[s.grades.length - 1].score
          : undefined,
      }));

    return res.status(200).json(response);
  } catch (err) {
    console.error("❌ Lỗi lấy dữ liệu học sinh:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

router.get("/students", verifyToken, requireTeacher, getStudents);

// ===== Lấy trạng thái khóa điểm =====
const getGradesLockStatus: RequestHandler = async (_req, res) => {
  try {
    const { connectDB } = await import("../configs/db"); // không dùng .default
    const db = await connectDB();

    const settings = db.collection<IGradesLock>("settings");
    const lockDoc = await settings.findOne({ _id: "gradesLockStatus" });

    return res.status(200).json({ locked: lockDoc?.locked ?? false });
  } catch (err) {
    console.error("❌ GET /grades/status teacher error:", err);
    return res
      .status(500)
      .json({ message: "Lỗi lấy trạng thái khóa điểm", error: err });
  }
};

router.get("/grades/status", verifyToken, requireTeacher, getGradesLockStatus);

export default router;
