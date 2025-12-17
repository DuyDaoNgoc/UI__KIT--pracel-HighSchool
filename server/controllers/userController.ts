import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { User } from "../models/User";
import { connectDB } from "../configs/db";
import { toSafeUser } from "../types/user";
import nodemailer from "nodemailer";

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
      major: Array.isArray(targetUserData?.majors)
        ? targetUserData.majors.join(", ")
        : targetUserData.major || targetUserData.majors || "",
      schoolYear: targetUserData.schoolYear || "",
      dob: targetUserData.dob || new Date("2000-01-01"),
      grade: targetUserData.grade || "",
      phone: targetUserData.phone || "",
      address: targetUserData.address || "",
      residence: targetUserData.residence || "",
      avatar:
        targetUserData.avatar ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      assignedClass: targetUserData.assignedClass || [],
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
    const { email, password, code } = req.body;

    if ((!email && !code) || !password) {
      return res.status(400).json({
        success: false,
        message: "❌ Missing credentials: provide email or code, and password",
      });
    }

    // Tìm user bằng mã (studentId/teacherId) nếu cung cấp, ngược lại bằng email
    let user: any = null;
    if (code) {
      user = await User.findOne({
        $or: [{ studentId: code }, { teacherId: code }],
      });
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "❌ Invalid credentials" });
    }

    // Kiểm tra tài khoản bị đình chỉ
    if ((user as any).isBlocked) {
      return res.status(403).json({
        success: false,
        message:
          "Tài khoản của bạn đã bị đình chỉ. Vui lòng liên hệ quản trị viên.",
        isBlocked: true,
      });
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
        { loginAttempts: user.loginAttempts, lockUntil: user.lockUntil },
      );

      return res.status(401).json({
        success: false,
        message: "❌ Invalid email or password",
        attemptsLeft: Math.max(0, 4 - user.loginAttempts),
        lockTime: user.lockUntil ? Math.ceil((user.lockUntil - now) / 1000) : 0,
      });
    }

    await User.updateOne({ _id: user._id }, { loginAttempts: 0, lockUntil: 0 });

    // ===== ENRICH USER DATA FROM STUDENTS/TEACHERS COLLECTION =====
    let enrichedUser = user.toObject();

    if (user.role === "student" && user.studentId) {
      const db = await connectDB();
      const studentDoc = await db
        .collection("students")
        .findOne({ studentId: user.studentId });

      if (studentDoc) {
        // Fill missing fields from student doc
        enrichedUser = {
          ...enrichedUser,
          dob: enrichedUser.dob || studentDoc.dob,
          phone: enrichedUser.phone || studentDoc.phone,
          address: enrichedUser.address || studentDoc.address,
          residence: enrichedUser.residence || studentDoc.residence,
          schoolYear: enrichedUser.schoolYear || studentDoc.schoolYear,
          gender: enrichedUser.gender || studentDoc.gender,
          classCode:
            enrichedUser.classCode ||
            studentDoc.classCode ||
            studentDoc.classLetter,
          major: enrichedUser.major || studentDoc.major,
          grade: enrichedUser.grade || studentDoc.grade,
        };
      }
    }

    if (user.role === "teacher" && user.teacherId) {
      const db = await connectDB();
      const teacherDoc = await db
        .collection("teachers")
        .findOne({ teacherId: user.teacherId });

      if (teacherDoc) {
        // Fill missing fields from teacher doc
        enrichedUser = {
          ...enrichedUser,
          dob: enrichedUser.dob || teacherDoc.dob,
          phone: enrichedUser.phone || teacherDoc.phone,
          address: enrichedUser.address || teacherDoc.address,
          schoolYear: enrichedUser.schoolYear || teacherDoc.schoolYear,
          gender: enrichedUser.gender || teacherDoc.gender,
          major: enrichedUser.major || teacherDoc.major || teacherDoc.majors,
          majors: enrichedUser.majors || teacherDoc.majors || [],
          // include assigned classes so frontend can show them immediately
          assignedClass: teacherDoc.assignedClass || [],
        };
      }
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        studentId: user.studentId,
        teacherId: user.teacherId,
        parentId: user.parentId,
      },
      process.env.JWT_SECRET as string,
    );

    return res.json({
      success: true,
      message: "✅ Login successful",
      token,
      user: toSafeUser(enrichedUser as any),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "❌ Server error" });
  }
};

// ===================== FORGOT PASSWORD =====================
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { code, email } = req.body;

    if (!code && !email) {
      return res
        .status(400)
        .json({ success: false, message: "Missing field: code or email" });
    }

    // Tìm user theo code hoặc email
    const user = await User.findOne(
      code ? { $or: [{ studentId: code }, { teacherId: code }] } : { email },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Gửi thông báo tới admin (ADMIN_EMAIL) để họ xử lý tạo lại mật khẩu
    const adminEmail = process.env.ADMIN_EMAIL;
    const requester = email || user.email || "(no email)";

    const mailBody = `Yêu cầu đặt lại mật khẩu:\n- Người yêu cầu: ${requester}\n- Mã người dùng: ${user.studentId || user.teacherId || "-"}\n- Tên: ${user.username || "-"}\n- ID: ${user._id}\n\nVui lòng truy cập hệ thống quản trị để tạo lại mật khẩu.`;

    try {
      if (process.env.SMTP_HOST && adminEmail) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: (process.env.SMTP_SECURE || "false") === "true",
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        });

        await transporter.sendMail({
          from:
            process.env.SMTP_FROM ||
            `no-reply@${process.env.DOMAIN || "local"}`,
          to: adminEmail,
          subject: "[Yêu cầu] Đặt lại mật khẩu người dùng",
          text: mailBody,
        });
      } else {
        console.log("Forgot-password request -> Admin:", adminEmail);
        console.log(mailBody);
      }
    } catch (mailErr) {
      console.warn("Could not send forgot-password email:", mailErr);
    }

    return res.json({
      success: true,
      message:
        "Yêu cầu đã gửi tới quản trị viên. Họ sẽ tạo lại mật khẩu cho bạn (hoặc bạn sẽ nhận email từ admin).",
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
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

        // 2) nếu thiếu một số field, fallback sang students/teachers collection theo role
        if (u.role === "student" && u.studentId) {
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

            // bổ sung các trường thông tin cá nhân nếu user thiếu
            if (!safeUser.phone && student.phone)
              safeUser.phone = student.phone;
            if (
              (!safeUser.address || safeUser.address === "") &&
              student.address
            )
              safeUser.address = student.address;
            if ((!safeUser.dob || safeUser.dob === null) && student.dob)
              safeUser.dob = student.dob;
            if (
              (!safeUser.residence || safeUser.residence === "") &&
              student.residence
            )
              safeUser.residence = student.residence;
            if (
              (!safeUser.schoolYear || safeUser.schoolYear === "") &&
              student.schoolYear
            )
              safeUser.schoolYear = student.schoolYear;
            if (
              (!safeUser.gender || safeUser.gender === undefined) &&
              student.gender
            )
              safeUser.gender = student.gender;
          }
        }

        if (u.role === "teacher" && u.teacherId) {
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
              teacher?.major ||
              (Array.isArray(teacher?.majors)
                ? teacher.majors.join(", ")
                : teacher?.majors || "");

            // bổ sung các trường thông tin cá nhân nếu user thiếu
            if (!safeUser.phone && teacher.phone)
              safeUser.phone = teacher.phone;
            if (
              (!safeUser.address || safeUser.address === "") &&
              teacher.address
            )
              safeUser.address = teacher.address;
            if ((!safeUser.dob || safeUser.dob === null) && teacher.dob)
              safeUser.dob = teacher.dob;
            if (
              (!safeUser.schoolYear || safeUser.schoolYear === "") &&
              teacher.schoolYear
            )
              safeUser.schoolYear = teacher.schoolYear;
            if (
              (!safeUser.gender || safeUser.gender === undefined) &&
              teacher.gender
            )
              safeUser.gender = teacher.gender;
            // Assign assignedClass từ teacher (nếu chưa có từ users collection)
            if (!safeUser.assignedClass && teacher?.assignedClass) {
              safeUser.assignedClass = teacher?.assignedClass;
            }
          }
        }

        // normalize thành object (frontend hiện tại của bạn có thể nhận object)
        const classObj = classStr
          ? { className: classStr, grade: u.grade || "" }
          : null;
        const majorObj = majorStr
          ? { name: majorStr, code: (u as any).majorCode || "" }
          : null;

        // Lấy majors array từ teacher nếu là giáo viên
        let majorsArr: string[] = [];
        if (u.role === "teacher" && u.teacherId) {
          const teacher = await teachers.findOne({ teacherId: u.teacherId });
          if (teacher && Array.isArray(teacher.majors)) {
            majorsArr = teacher.majors;
          }
          // Đảm bảo assignedClass luôn được lấy từ teacher (kiểm tra teacher trước)
          if (!safeUser.assignedClass && teacher && teacher.assignedClass) {
            safeUser.assignedClass = teacher.assignedClass;
          }
        }

        return {
          ...safeUser,
          // giữ tên field giống bạn đang dùng: classCode + major
          classCode: classObj,
          major: majorObj,
          majors: majorsArr, // chuyên ngành cho giáo viên
          assignedClass: safeUser.assignedClass, // đảm bảo gửi assignedClass
          role: u.role,
        };
      }),
    );

    res.status(200).json(result);
  } catch (err) {
    console.error("GetAllUsers error:", err);
    res.status(500).json({ success: false, message: " Server error" });
  }
};

// ===================== DELETE USER =====================
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: " Invalid ID" });
    }

    const deletedUser = await User.findByIdAndDelete(new ObjectId(id));
    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: " User not found" });
    }

    res
      .status(200)
      .json({ success: true, message: " User deleted successfully" });
  } catch (err) {
    console.error("DeleteUser error:", err);
    res.status(500).json({ success: false, message: " Server error" });
  }
};
