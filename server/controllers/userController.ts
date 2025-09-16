import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { connectDB } from "../configs/db";
import { toSafeUser } from "../types/user";

// ===================== REGISTER =====================
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { studentCode, email, password } = req.body;

    if (!studentCode)
      return res
        .status(400)
        .json({ success: false, message: "❌ Missing field: studentCode" });
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "❌ Missing field: email" });
    if (!password)
      return res
        .status(400)
        .json({ success: false, message: "❌ Missing field: password" });

    const db = await connectDB();
    const student = await db
      .collection("students")
      .findOne({ studentId: studentCode });
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "❌ Student code not found" });

    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res
        .status(400)
        .json({ success: false, message: "❌ Email already registered" });

    const existingStudent = await User.findOne({
      studentId: student.studentId,
    });
    if (existingStudent)
      return res.status(400).json({
        success: false,
        message: "❌ Student code has already been used to create an account",
      });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: any = await User.create({
      username: student.name,
      email,
      password: hashedPassword,
      role: "student",
      studentId: student.studentId,
      teacherId: student.teacherId || "",
      parentId: student.parentId || "",
      class: student.classLetter || "",
      schoolYear: student.schoolYear || "",
      dob: student.dob || new Date("2000-01-01"),
      grade: student.grade || "",
      phone: student.phone || "",
      address: student.address || "",
      residence: student.residence || "",
      avatar:
        student.avatar ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      children: [],
      loginAttempts: 0,
      lockUntil: 0,
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "✅ User registered successfully",
      user: toSafeUser(newUser),
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "❌ Server error" });
  }
};

// ===================== LOGIN =====================
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "❌ Missing field: email" });
    if (!password)
      return res
        .status(400)
        .json({ success: false, message: "❌ Missing field: password" });

    const user: any = await User.findOne({ email });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "❌ Invalid email or password" });

    const now = Date.now();

    // --- Kiểm tra lock ---
    if (user.lockUntil && user.lockUntil > now) {
      const secondsLeft = Math.ceil((user.lockUntil - now) / 1000);
      return res.status(403).json({
        success: false,
        message: `Tài khoản bị khóa. Thử lại sau ${secondsLeft} giây`,
        lockTime: secondsLeft,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      // --- Tăng loginAttempts và lock nếu cần ---
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts > 4) {
        const lockSeconds = Math.pow(2, user.loginAttempts - 4) * 10;
        user.lockUntil = now + lockSeconds * 1000;
      }

      await User.updateOne(
        { _id: user._id },
        { loginAttempts: user.loginAttempts, lockUntil: user.lockUntil }
      );

      return res.status(401).json({
        success: false,
        message: "❌ Invalid email or password",
        attemptsLeft: Math.max(0, 4 - user.loginAttempts),
        lockTime: user.lockUntil ? Math.ceil((user.lockUntil - now) / 1000) : 0,
      });
    }

    // --- Login thành công: reset loginAttempts và lockUntil ---
    await User.updateOne({ _id: user._id }, { loginAttempts: 0, lockUntil: 0 });

    // --- JWT vĩnh viễn ---
    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        studentId: user.studentId,
        teacherId: user.teacherId,
        parentId: user.parentId,
        customId: user.customId,
      },
      process.env.JWT_SECRET as string
    );

    return res.json({
      success: true,
      message: "✅ Login successful",
      token,
      user: toSafeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "❌ Server error" });
  }
};
