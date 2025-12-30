// server/Routers/teacherAuth.ts
import { Router, RequestHandler } from "express";
import {
  verifyToken,
  requireTeacher,
  AuthRequest,
} from "../../middleware/authMiddleware";
import User from "../../models/User"; // Model người dùng (bao gồm học sinh)
import { IUserDocument } from "../../types/user"; // Interface đúng
import { createTeacher } from "../../controllers/admin/teacher/registerTeacher"; // controller mới

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
  await createTeacher(req, res);
});

// ===== Lấy danh sách học sinh của giáo viên =====
const getStudents: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const tokenUser = authReq.user;

  if (!tokenUser || !tokenUser.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Load full User doc for the requesting teacher to obtain teacherId/refs
    const teacherUser = await User.findById(tokenUser.id).select(
      "_id teacherId",
    );
    if (!teacherUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Build a filter that matches users by teacherRef (object ref) or by teacherId code
    const orFilters: any[] = [];
    try {
      orFilters.push({ teacherRef: teacherUser._id });
    } catch (e) {
      // ignore
    }
    if (teacherUser.teacherId) {
      orFilters.push({ teacherId: teacherUser.teacherId });
      // also support matching teacherId if stored as the User._id string
      orFilters.push({ teacherId: String(teacherUser._id) });
    } else {
      // fallback: match teacherId as the user._id string
      orFilters.push({ teacherId: String(teacherUser._id) });
    }

    const students: IUserDocument[] = await User.find({
      role: "student",
      $or: orFilters,
    }).select("_id username classCode grades");

    const response: IStudentResponse[] = students
      .filter((s) => s._id)
      .map((s) => ({
        _id: s._id!.toString(),
        username: s.username,
        class: (s as any).classCode || "Chưa có lớp",
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

router.get("/admin/students", verifyToken, requireTeacher, getStudents);

// ===== Lấy trạng thái khóa điểm =====
const getGradesLockStatus: RequestHandler = async (_req, res) => {
  try {
    const { connectDB } = await import("../../configs/db"); // không dùng .default
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
