import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "../../configs/db";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { studentCode, teacherCode, email, password } = req.body;

    // 🔎 Validate input
    if (
      (!studentCode?.trim() && !teacherCode?.trim()) ||
      !email?.trim() ||
      !password?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const db = await connectDB();
    const users = db.collection("users");
    const students = db.collection("students");
    const teachers = db.collection("teachers");

    // 🔎 Check email tồn tại
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    let accountInfo: any = null;
    let role: "student" | "teacher" = "student";
    let codeValue: string = "";

    // 🔎 Xác định student hay teacher
    if (studentCode?.trim()) {
      accountInfo = await students.findOne({ studentId: studentCode.trim() });
      if (!accountInfo) {
        return res.status(404).json({
          success: false,
          message: "Student code not found",
        });
      }
      codeValue = studentCode.trim();
      role = "student";
    } else if (teacherCode?.trim()) {
      accountInfo = await teachers.findOne({ teacherId: teacherCode.trim() });
      if (!accountInfo) {
        return res.status(404).json({
          success: false,
          message: "Teacher code not found",
        });
      }
      codeValue = teacherCode.trim();
      role = "teacher";
    }

    // 🔎 Kiểm tra code đã tạo user chưa
    const existingCodeUser = await users.findOne({
      $or: [{ studentId: codeValue }, { teacherId: codeValue }],
    });
    if (existingCodeUser) {
      return res.status(400).json({
        success: false,
        message: "This code is already linked to an account",
      });
    }

    // 🔎 Hash password & insert
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      customId: crypto.randomBytes(6).toString("hex"),
      username: accountInfo.name || codeValue,
      email,
      password: hashedPassword,
      role,
      studentId: role === "student" ? codeValue : undefined,
      teacherId: role === "teacher" ? codeValue : undefined,
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    if (!result.acknowledged) {
      return res.status(500).json({
        success: false,
        message: "Failed to create user",
      });
    }

    // ✅ Trả dữ liệu đầy đủ
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: result.insertedId.toString(),
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        studentId: newUser.studentId,
        teacherId: newUser.teacherId,
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
