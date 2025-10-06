import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "../../configs/db";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { studentCode, teacherCode, email, password } = req.body;

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

    const existingCodeUser = await users.findOne({
      $or: [{ studentId: codeValue }, { teacherId: codeValue }],
    });
    if (existingCodeUser) {
      return res.status(400).json({
        success: false,
        message: "This code is already linked to an account",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Thêm đầy đủ thông tin từ accountInfo (student hoặc teacher)
    const newUser = {
      customId: crypto.randomBytes(6).toString("hex"),
      username: accountInfo.name || codeValue,
      email,
      password: hashedPassword,
      role,
      studentId: role === "student" ? codeValue : undefined,
      teacherId: role === "teacher" ? codeValue : undefined,

      // ✅ Bổ sung toàn bộ thông tin từ bảng gốc
      name: accountInfo.name || "",
      dob: accountInfo.dob || "",
      gender: accountInfo.gender || "",
      phone: accountInfo.phone || "",
      address: accountInfo.address || "",
      residence: accountInfo.residence || "",
      grade: accountInfo.grade || "",
      classLetter: accountInfo.classLetter || "",
      major: accountInfo.major || "",
      classCode: accountInfo.classCode || "",
      schoolYear: accountInfo.schoolYear || "",

      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    if (!result.acknowledged) {
      return res.status(500).json({
        success: false,
        message: "Failed to create user",
      });
    }

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
        name: newUser.name,
        dob: newUser.dob,
        gender: newUser.gender,
        phone: newUser.phone,
        address: newUser.address,
        residence: newUser.residence,
        grade: newUser.grade,
        classLetter: newUser.classLetter,
        major: newUser.major,
        classCode: newUser.classCode,
        schoolYear: newUser.schoolYear,
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
