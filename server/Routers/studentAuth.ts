// server/Routers/studentAuth.ts
import { Router, Request, Response } from "express";
import User from "../models/User"; // chỉ import model
import { IUser } from "../types/user"; // import interface
import { Document } from "mongoose"; // để tạo kiểu Mongoose Document
import {
  verifyToken,
  checkRole,
  AuthRequest,
} from "../middleware/authMiddleware";

import ClassModel from "../models/Class";

import { generateClassCode } from "../helpers/classCode"; // ✅ helper sinh mã lớp

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
      major, // ✅ ngành
      studentId: frontendStudentId,
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !grade || !classLetter || !schoolYear || !major) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    try {
      // Tự sinh studentId nếu frontend không gửi
      let studentId = frontendStudentId;
      if (!studentId) {
        const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
        studentId = `${grade}${classLetter}${randomPart}`;
      }

      // Sinh classCode = khối + lớp + viết tắt ngành
      const classCode = generateClassCode(grade, classLetter, major);

      // Kiểm tra trùng studentId
      const existing = await User.findOne({ studentId });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Mã học sinh đã tồn tại, thử lại" });
      }

      // Tạo học sinh mới
      const student: IUserDocument = new User({
        username: name, // dùng username thay cho name
        dob,
        address,
        residence,
        phone,
        teacherId: "",
        grade,
        class: classLetter,
        schoolYear,
        studentId,
        role: "student",
        major, // ✅ lưu ngành
        classCode, // ✅ lưu mã lớp
        createdAt: new Date(),
      });

      await student.save();

      // ✅ Upsert ClassModel: nếu chưa có thì tạo, có rồi thì thêm student
      await ClassModel.findOneAndUpdate(
        { classCode },
        {
          $setOnInsert: {
            grade,
            classLetter,
            major,
          },
          $addToSet: { studentIds: studentId },
        },
        { upsert: true, new: true }
      );

      return res.status(201).json({
        message: "Tạo mã học sinh thành công",
        studentId: student.studentId,
        classCode,
      });
    } catch (err) {
      console.error("students/create error:", err);
      return res.status(500).json({ message: "Không thể tạo mã học sinh" });
    }
  }
);

export default router;
