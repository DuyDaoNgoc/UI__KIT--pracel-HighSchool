import { Router, RequestHandler } from "express";
import { Types } from "mongoose";
import {
  verifyToken,
  requireTeacher,
  AuthRequest,
} from "../middleware/authMiddleware";
import { User } from "../models/User";
import { IUserDocument } from "../types/user";
import { connectDB } from "../configs/db";

interface IStudentResponse {
  _id: string;
  username: string;
  class?: string;
  grade?: number;
}

interface IGradesLock {
  _id: string;
  locked: boolean;
}

const router = Router();

const getStudents: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const teacher = authReq.user;

  if (!teacher || !teacher.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // ✅ validate id trước khi convert
    if (!Types.ObjectId.isValid(teacher.id)) {
      return res.status(400).json({ message: "Invalid teacher id" });
    }
    const teacherObjectId = new Types.ObjectId(teacher.id);

    // ✅ Lấy danh sách học sinh của giáo viên
    const students: IUserDocument[] = await User.find({
      role: "student",
      teacherId: teacherObjectId,
    }).select("_id username class grades");

    const response: IStudentResponse[] = students.map((s) => ({
      _id: s._id!.toString(),
      username: s.username,
      class: s.class || "?",
      grade: s.grades?.length ? s.grades[s.grades.length - 1].score : undefined,
    }));

    return res.status(200).json(response);
  } catch (err) {
    console.error("❌ Lỗi lấy dữ liệu học sinh:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

router.get("/students", verifyToken, requireTeacher, getStudents);

// ===== API lấy trạng thái khóa điểm =====
const getGradesLockStatus: RequestHandler = async (req, res) => {
  try {
    const db = await connectDB();
    const settings = db.collection<IGradesLock>("settings");
    const lockDoc = await settings.findOne({ _id: "gradesLockStatus" });
    res.json({ locked: lockDoc?.locked ?? false });
  } catch (err) {
    console.error("❌ GET /grades/status teacher error:", err);
    res
      .status(500)
      .json({ message: "Lỗi lấy trạng thái khóa điểm", error: err });
  }
};

router.get("/grades/status", verifyToken, requireTeacher, getGradesLockStatus);

export default router;
