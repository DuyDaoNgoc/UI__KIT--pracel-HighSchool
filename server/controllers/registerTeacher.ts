// server/controllers/registerTeacher.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "../configs/db";

export const registerTeacher = async (req: Request, res: Response) => {
  try {
    const { teacherId, email, password } = req.body;

    if (!teacherId)
      return res.status(400).json({
        success: false,
        field: "teacherId",
        message: "Teacher ID is required",
      });
    if (!email)
      return res
        .status(400)
        .json({ success: false, field: "email", message: "Email is required" });
    if (!password)
      return res.status(400).json({
        success: false,
        field: "password",
        message: "Password is required",
      });

    const db = await connectDB();
    const users = db.collection("users");
    const teachers = db.collection("teachers");
    const classes = db.collection("classes");
    const students = db.collection("students");

    // Check email đã tồn tại chưa
    const existingUser = await users.findOne({ email });
    if (existingUser)
      return res.status(400).json({
        success: false,
        field: "email",
        message: "Email already registered",
      });

    // Tìm giáo viên trong collection teachers
    const teacher = await teachers.findOne({ teacherId });
    if (!teacher)
      return res.status(404).json({
        success: false,
        field: "teacherId",
        message: "Teacher ID not found",
      });

    // Check teacherId đã có user chưa
    const existingTeacherUser = await users.findOne({
      teacherId: teacher.teacherId,
    });
    if (existingTeacherUser)
      return res.status(400).json({
        success: false,
        field: "teacherId",
        message: "This teacher ID is already linked to an account",
      });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      customId: crypto.randomBytes(6).toString("hex"),
      username: teacher.name || teacher.teacherId,
      teacherId: teacher.teacherId,
      email,
      password: hashedPassword,
      role: "teacher",
      dob: teacher.dob || null,
      phone: teacher.phone || null,
      address: teacher.address || null,
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    // ===== Xử lý lớp ngành =====
    const major = teacher.major;
    const classCode = teacher.classCode;
    const grade = teacher.grade;
    const classLetter = teacher.classLetter;

    if (major && classCode) {
      let cls = await classes.findOne({ classCode, major });

      if (!cls) {
        // Tạo lớp mới nếu chưa tồn tại
        const insertResult = await classes.insertOne({
          grade,
          classLetter,
          major,
          classCode,
          teacherName: teacher.name,
          studentIds: [],
        });
        cls = { _id: insertResult.insertedId };
      } else {
        // Cập nhật giáo viên chủ nhiệm nếu đã có lớp
        await classes.updateOne(
          { _id: cls._id },
          { $set: { teacherName: teacher.name } }
        );
      }

      // Gán teacherId cho các học sinh cùng lớp
      await students.updateMany(
        { grade, classLetter, major },
        { $set: { teacherId: teacher.teacherId } }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Teacher registered successfully",
      user: {
        id: result.insertedId,
        username: newUser.username,
        teacherId: newUser.teacherId,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Register teacher error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err instanceof Error ? err.message : err,
    });
  }
};

export default registerTeacher;
