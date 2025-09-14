// server/Routers/teacher.ts
import { Router, RequestHandler } from "express";
import {
  verifyToken,
  requireTeacher,
  AuthRequest,
} from "../middleware/authMiddleware";
import User from "../models/User"; // Mongoose model
import { IUserDocument } from "../types/user"; // Interface đúng

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

// ===== Lấy danh sách học sinh của giáo viên =====
const getStudents: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const teacher = authReq.user;

  if (!teacher || !teacher.teacherId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Lấy học sinh dựa trên teacherId (string)
    const students: IUserDocument[] = await User.find({
      role: "student",
      teacherId: teacher.teacherId, // query bằng string
    }).select("_id username class grades");

    const response: IStudentResponse[] = students.map((s) => ({
      _id: s._id!.toString(),
      username: s.username,
      class: s.class || "?",
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
    const db = await import("../configs/db").then((m) => m.connectDB());
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
