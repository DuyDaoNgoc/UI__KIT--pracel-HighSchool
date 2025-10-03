import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "../configs/db";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { studentCode, teacherCode, email, password } = req.body;

    // ===== Validate input =====
    if (!studentCode && !teacherCode) {
      return res.status(400).json({
        success: false,
        field: "code",
        message: "Student code or Teacher code is required",
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
    const teachers = db.collection("teachers");

    // ===== Check email đã tồn tại =====
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        field: "email",
        message: "Email already registered",
      });
    }

    let newUser: any;

    if (studentCode) {
      // ===== Lấy học sinh =====
      const student = await students.findOne({ studentId: studentCode });
      if (!student) {
        return res.status(404).json({
          success: false,
          field: "studentCode",
          message: "Student code not found",
        });
      }

      // ===== Kiểm tra đã tạo user chưa =====
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

      // ===== Hash password =====
      const hashedPassword = await bcrypt.hash(password, 10);

      // ===== Build classCode an toàn =====
      const safeClassCode =
        student.classCode ??
        `${student.grade || ""}${student.classLetter || ""}${(
          student.major || ""
        )
          .split(/\s+/)
          .map((w: string) => w[0]?.toUpperCase() || "")
          .join("")}`;

      newUser = {
        customId: crypto.randomBytes(6).toString("hex"),
        username: student.name || student.studentId,
        studentId: student.studentId,
        email,
        password: hashedPassword,
        role: "student",
        classCode: safeClassCode,
        major: student.major || "",
        createdAt: new Date(),
      };
    } else if (teacherCode) {
      // ===== Lấy giáo viên =====
      const teacher = await teachers.findOne({ teacherId: teacherCode });
      if (!teacher) {
        return res.status(404).json({
          success: false,
          field: "teacherCode",
          message: "Teacher code not found",
        });
      }

      // ===== Kiểm tra đã tạo user chưa =====
      const existingTeacherUser = await users.findOne({
        teacherId: teacher.teacherId,
      });
      if (existingTeacherUser) {
        return res.status(400).json({
          success: false,
          field: "teacherCode",
          message: "This teacher code is already linked to an account",
        });
      }

      // ===== Hash password =====
      const hashedPassword = await bcrypt.hash(password, 10);

      const teacherMajor = Array.isArray(teacher.majors)
        ? teacher.majors.join(", ")
        : teacher.major || "";

      newUser = {
        customId: crypto.randomBytes(6).toString("hex"),
        username: teacher.name || teacher.teacherId,
        teacherId: teacher.teacherId,
        email,
        password: hashedPassword,
        role: "teacher",
        classCode: teacher.classCode || "",
        major: teacherMajor,
        createdAt: new Date(),
      };
    }

    // ===== Insert user =====
    const result = await users.insertOne(newUser);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: result.insertedId,
        username: newUser.username,
        studentId: newUser.studentId,
        teacherId: newUser.teacherId,
        email: newUser.email,
        role: newUser.role,
        classCode: newUser.classCode,
        major: newUser.major,
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
