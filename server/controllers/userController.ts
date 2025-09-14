import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { connectDB } from "../configs/db";
import { IUserDocument, toSafeUser } from "../types/user";

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

    const newUser = await User.create({
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
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "✅ User registered successfully",
      user: toSafeUser(newUser as IUserDocument & { _id: any }),
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

    const user = (await User.findOne({ email })) as IUserDocument & {
      _id: any;
    };
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "❌ Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "❌ Invalid email or password" });

    // ================= JWT VĨNH VIỄN =================
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
      // Không đặt expiresIn => token sẽ vĩnh viễn
    );

    return res.json({
      success: true,
      message: "✅ Login successful",
      token,
      user: toSafeUser(user), // username = tên học sinh
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "❌ Server error" });
  }
};
