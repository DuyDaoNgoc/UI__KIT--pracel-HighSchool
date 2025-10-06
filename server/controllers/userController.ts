import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { User } from "../models/User";
import { connectDB } from "../configs/db";
import { toSafeUser } from "../types/user";

// ===================== REGISTER =====================
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { studentCode, teacherCode, email, password } = req.body;

    if (!studentCode && !teacherCode) {
      return res.status(400).json({
        success: false,
        message: "❌ Missing field: studentCode or teacherCode",
      });
    }
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "❌ Missing field: email" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "❌ Missing field: password" });
    }

    const db = await connectDB();

    let targetUserData: any = null;
    let role: "student" | "teacher" = "student";

    if (studentCode) {
      targetUserData = await db
        .collection("students")
        .findOne({ studentId: studentCode });
      role = "student";
      if (!targetUserData) {
        return res
          .status(404)
          .json({ success: false, message: "❌ Student code not found" });
      }
    }

    if (teacherCode) {
      targetUserData = await db
        .collection("teachers")
        .findOne({ teacherId: teacherCode });
      role = "teacher";
      if (!targetUserData) {
        return res
          .status(404)
          .json({ success: false, message: "❌ Teacher code not found" });
      }
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res
        .status(400)
        .json({ success: false, message: "❌ Email already registered" });
    }

    const existingUser = await User.findOne({
      $or: [
        { studentId: targetUserData?.studentId || null },
        { teacherId: targetUserData?.teacherId || null },
      ],
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "❌ This account has already been created",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserData = {
      username:
        targetUserData.name ||
        targetUserData.teacherId ||
        targetUserData.studentId ||
        "Unknown",
      email,
      password: hashedPassword,
      role,
      studentId: targetUserData.studentId || "",
      teacherId: targetUserData.teacherId || "",
      parentId: targetUserData.parentId || "",
      classCode: targetUserData.classCode || targetUserData.classLetter || "",
      major: targetUserData.major || targetUserData.majors || "",
      schoolYear: targetUserData.schoolYear || "",
      dob: targetUserData.dob || new Date("2000-01-01"),
      grade: targetUserData.grade || "",
      phone: targetUserData.phone || "",
      address: targetUserData.address || "",
      residence: targetUserData.residence || "",
      avatar:
        targetUserData.avatar ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      children: [],
      loginAttempts: 0,
      lockUntil: 0,
      createdAt: new Date(),
    };

    const newUser = await User.create(newUserData);

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

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "❌ Missing field: email" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "❌ Missing field: password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "❌ Invalid email or password" });
    }

    const now = Date.now();

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

    await User.updateOne({ _id: user._id }, { loginAttempts: 0, lockUntil: 0 });

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        studentId: user.studentId,
        teacherId: user.teacherId,
        parentId: user.parentId,
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
// ===================== GET ALL USERS =====================
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const students = db.collection("students");
    const teachers = db.collection("teachers");

    // lấy users từ mongoose (lean trả object thuần)
    const users = await User.find().lean();

    const result = await Promise.all(
      users.map(async (u: any) => {
        const safeUser = toSafeUser(u as any);

        // --- Hàm phụ: lấy string từ nhiều kiểu field ---
        const extractClassString = (obj: any) => {
          if (!obj) return "";
          if (typeof obj === "string") return obj;
          if (typeof obj === "object") {
            return (
              obj.className ||
              obj.class ||
              obj.classCode ||
              obj.classLetter ||
              ""
            );
          }
          return "";
        };
        const extractMajorString = (obj: any) => {
          if (!obj) return "";
          if (typeof obj === "string") return obj;
          if (Array.isArray(obj)) return obj.join(", ");
          if (typeof obj === "object")
            return (
              obj.name ||
              (obj.majors
                ? Array.isArray(obj.majors)
                  ? obj.majors.join(", ")
                  : obj.majors
                : "")
            );
          return "";
        };

        // 1) ưu tiên lấy từ chính document user
        let classStr = "";
        let majorStr = "";

        // user có thể chứa classCode (string/object), class, classLetter,...
        classStr =
          extractClassString(u.classCode) ||
          extractClassString(u.class) ||
          extractClassString((u as any).classLetter);
        majorStr =
          extractMajorString(u.major) || extractMajorString((u as any).majors);

        // 2) nếu thiếu, fallback sang students/teachers collection theo role
        if ((!classStr || !majorStr) && u.role === "student" && u.studentId) {
          const student = await students.findOne({ studentId: u.studentId });
          if (student) {
            classStr =
              classStr ||
              student.classCode ||
              student.class ||
              student.classLetter ||
              "";
            majorStr =
              majorStr ||
              student.major ||
              (Array.isArray(student.majors)
                ? student.majors.join(", ")
                : student.majors || "");
          }
        }

        if ((!classStr || !majorStr) && u.role === "teacher" && u.teacherId) {
          const teacher = await teachers.findOne({ teacherId: u.teacherId });
          if (teacher) {
            classStr =
              classStr ||
              teacher.classCode ||
              teacher.class ||
              teacher.className ||
              "";
            majorStr =
              majorStr ||
              teacher.major ||
              (Array.isArray(teacher.majors)
                ? teacher.majors.join(", ")
                : teacher.majors || "");
          }
        }

        // normalize thành object (frontend hiện tại của bạn có thể nhận object)
        const classObj = classStr
          ? { className: classStr, grade: u.grade || "" }
          : null;
        const majorObj = majorStr
          ? { name: majorStr, code: (u as any).majorCode || "" }
          : null;

        return {
          ...safeUser,
          // giữ tên field giống bạn đang dùng: classCode + major
          classCode: classObj,
          major: majorObj,
          role: u.role,
        };
      })
    );

    res.status(200).json(result);
  } catch (err) {
    console.error("GetAllUsers error:", err);
    res.status(500).json({ success: false, message: "❌ Server error" });
  }
};

// ===================== DELETE USER =====================
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "❌ Invalid ID" });
    }

    const deletedUser = await User.findByIdAndDelete(new ObjectId(id));
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "❌ User not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "✅ User deleted successfully" });
  } catch (err) {
    console.error("DeleteUser error:", err);
    res.status(500).json({ success: false, message: "❌ Server error" });
  }
};
