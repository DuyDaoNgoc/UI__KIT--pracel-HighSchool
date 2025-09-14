import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "../../configs/db";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { studentCode, email, password } = req.body;

    // 🔎 Validate input
    if (!studentCode?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const db = await connectDB();
    const users = db.collection("users");

    // 🔎 Check email tồn tại
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      customId: crypto.randomBytes(6).toString("hex"),
      username: studentCode, // dùng studentCode làm username
      email,
      password: hashedPassword,
      role: "student",
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    if (!result.acknowledged) {
      return res.status(500).json({
        success: false,
        message: "Failed to create user",
      });
    }

    // ✅ Trả dữ liệu đầy đủ để FE dễ xử lý
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: result.insertedId.toString(),
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        studentCode, // trả thêm cho rõ
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
