import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "../configs/db";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { studentCode, email, password } = req.body;

    // ===== Validate input rõ ràng =====
    if (!studentCode) {
      return res.status(400).json({
        success: false,
        field: "studentCode",
        message: "Student code is required",
      });
    }
    if (!email) {
      return res.status(400).json({
        success: false,
        field: "email",
        message: "Email is required",
      });
    }
    if (!password) {
      return res.status(400).json({
        success: false,
        field: "password",
        message: "Password is required",
      });
    }

    const db = await connectDB();
    const users = db.collection("users");
    const students = db.collection("students");

    // ===== Check email đã tồn tại chưa =====
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        field: "email",
        message: "Email already registered",
      });
    }

    // ===== Tìm học sinh trong collection students =====
    const student = await students.findOne({ studentId: studentCode });
    if (!student) {
      return res.status(404).json({
        success: false,
        field: "studentCode",
        message: "Student code not found",
      });
    }

    // ===== Kiểm tra studentCode đã được tạo user chưa =====
    const existingStudentUser = await users.findOne({
      studentId: student.studentId,
    });
    if (existingStudentUser) {
      return res.status(400).json({
        success: false,
        field: "studentCode",
        message: "This student code is already linked to an account",
      });
    }

    // ===== Hash password & insert =====
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      customId: crypto.randomBytes(6).toString("hex"),
      username: student.name || student.studentId, // Ưu tiên tên thật
      studentId: student.studentId, // Lưu riêng mã học sinh
      email,
      password: hashedPassword,
      role: "student",
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: result.insertedId,
        username: newUser.username,
        studentId: newUser.studentId,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err instanceof Error ? err.message : err,
    });
  }
};
