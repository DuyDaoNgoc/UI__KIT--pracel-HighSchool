// server/Routers/students.ts
import { Router, Request, Response } from "express";
import User from "../models/User"; // chỉ import model
import { IUser } from "../types/user"; // import interface
import { Document } from "mongoose"; // để tạo kiểu Mongoose Document
import {
  verifyToken,
  checkRole,
  AuthRequest,
} from "../middleware/authMiddleware";

// Tạo kiểu cho Document Mongoose
type IUserDocument = IUser & Document;

const router = Router();

// POST /api/admin/students/create
router.post(
  "/create",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const admin = authReq.user;

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      name,
      dob,
      address,
      residence,
      phone,
      grade,
      classLetter,
      schoolYear,
      studentId: frontendStudentId,
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !grade || !classLetter || !schoolYear) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    try {
      // Tự sinh studentId nếu frontend không gửi
      let studentId = frontendStudentId;
      if (!studentId) {
        const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
        studentId = `${grade}${classLetter}${randomPart}`;
      }

      // Kiểm tra trùng studentId
      const existing = await User.findOne({ studentId });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Mã học sinh đã tồn tại, thử lại" });
      }

      // Tạo học sinh mới (chỉ có thông tin cơ bản + studentId, không có email/password)
      const student: IUserDocument = new User({
        username: name, // dùng username thay cho name
        dob,
        address,
        residence,
        phone,
        grade,
        class: classLetter,
        schoolYear,
        studentId,
        role: "student",
      });

      await student.save();

      return res.status(201).json({
        message: "Tạo mã học sinh thành công",
        studentId: student.studentId,
      });
    } catch (err) {
      console.error("students/create error:", err);
      return res.status(500).json({ message: "Không thể tạo mã học sinh" });
    }
  }
);

export default router;
