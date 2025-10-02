import { Router, RequestHandler } from "express";
import { registerUser } from "../controllers/registerUser";
import { loginUser } from "../controllers/userController";
import {
  verifyToken,
  checkRole,
  AuthRequest,
} from "../middleware/authMiddleware";
import { connectDB } from "../configs/db";
import { ObjectId } from "mongodb";

const router = Router();

// ===================== REGISTER =====================
router.post("/register", registerUser as RequestHandler);

// ===================== LOGIN =====================
router.post("/login", loginUser as RequestHandler);

// ===================== GET CURRENT USER =====================
router.get("/me", verifyToken, (async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "❌ Unauthorized" });
    }

    const db = await connectDB();
    const users = db.collection("users");

    // Lấy user theo ObjectId
    const user = await users.findOne(
      { _id: new ObjectId(req.user.id) },
      {
        projection: {
          _id: 1,
          studentId: 1,
          teacherId: 1, // thêm teacherId
          username: 1,
          email: 1,
          role: 1,
        },
      }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "❌ User not found" });
    }

    let finalUsername = user.username;

    // Nếu là học sinh, ưu tiên lấy tên thật từ students
    if (user.role === "student" && user.studentId) {
      const students = db.collection("students");
      const student = await students.findOne(
        { studentId: user.studentId },
        { projection: { name: 1 } }
      );
      if (student?.name) {
        finalUsername = student.name;
      }
    }

    // Nếu là giáo viên, ưu tiên lấy tên thật từ teachers
    if (user.role === "teacher" && user.teacherId) {
      const teachers = db.collection("teachers");
      const teacher = await teachers.findOne(
        { teacherId: user.teacherId },
        { projection: { name: 1 } }
      );
      if (teacher?.name) {
        finalUsername = teacher.name;
      }
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        studentId: user.studentId || null,
        teacherId: user.teacherId || null,
        username: finalUsername,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("GET /me error:", err);
    return res.status(500).json({ success: false, message: "❌ Server error" });
  }
}) as RequestHandler);

// ===================== ADMIN ROUTE =====================
router.get("/admin", verifyToken, checkRole(["admin"]), ((
  req: AuthRequest,
  res
) => {
  res.json({
    success: true,
    message: "✅ Welcome Admin!",
    user: req.user,
  });
}) as RequestHandler);

export default router;
