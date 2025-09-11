// server/Routers/teacherStudents.ts
import { Router, Request, Response } from "express";
import User from "../models/User"; // default export
import { AuthRequest } from "../middleware/authMiddleware";
import { Types } from "mongoose";

const router = Router();

/**
 * Gán teacherId cho các học sinh trong lớp/folder "Duy04"
 * Lấy từ MongoDB mà không tạo mới học sinh
 */
router.post("/assign-teacher", async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const teacher = authReq.user;

  if (!teacher || !teacher._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { className } = req.body;

  if (!className) {
    return res
      .status(400)
      .json({ message: "Missing className in request body" });
  }

  try {
    // Lấy học sinh chưa có teacherId trong lớp className
    const students = await User.find({
      role: "student",
      class: className,
      teacherId: { $exists: false },
    });

    const teacherObjectId = new Types.ObjectId(teacher._id);

    const updatedStudents = await Promise.all(
      students.map(async (s) => {
        s.teacherId = teacherObjectId;
        await s.save();
        return {
          _id: s._id.toString(),
          username: s.username,
          class: s.class,
        };
      })
    );

    return res.status(200).json({
      message: `Assigned teacher to ${updatedStudents.length} students in class ${className}`,
      students: updatedStudents,
    });
  } catch (err) {
    console.error("❌ Lỗi gán teacherId:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
