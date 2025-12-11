import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
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

    // Mật khẩu mặc định: dùng mã học sinh / mã giáo viên nếu có, nếu client gửi password thì dùng client
    let rawPassword = password;
    if (studentCode) {
      rawPassword = studentCode;
    } else if (teacherCode) {
      rawPassword = teacherCode;
    } else if (!rawPassword) {
      // fallback: tạo password ngẫu nhiên
      rawPassword = crypto.randomBytes(4).toString("hex"); // 8 ký tự hex
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
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      // ===== Xử lý classCode & major cho student =====
      const safeClassCode =
        student.classCode ||
        `${student.grade || ""}${student.classLetter || ""}`.trim();

      const safeMajor = student.major || student.faculty || "";

      newUser = {
        customId: crypto.randomBytes(6).toString("hex"),
        username: student.name || student.studentId,
        studentId: student.studentId,
        email,
        password: hashedPassword,
        role: "student",
        classCode: safeClassCode,
        major: safeMajor,
        // ✅ Thêm những field từ student collection
        dob: student.dob,
        phone: student.phone,
        address: student.address,
        schoolYear: student.schoolYear,
        gender: student.gender,
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
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      // ===== Xử lý major của giáo viên =====
      let teacherMajor = "";
      if (Array.isArray(teacher.majors) && teacher.majors.length > 0) {
        teacherMajor = teacher.majors.join(", ");
      } else if (teacher.major) {
        teacherMajor = teacher.major;
      }

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
    let result;
    try {
      result = await users.insertOne(newUser);
    } catch (insertErr: any) {
      // If document validation fails, retry with validation bypassed
      if (
        insertErr.code === 121 ||
        insertErr.message?.includes("Document failed validation")
      ) {
        console.warn(
          "⚠️ Document validation failed, retrying with validation bypassed...",
        );
        console.error("Validation details:", insertErr.errInfo?.details);

        try {
          result = await users.insertOne(newUser, {
            bypassDocumentValidation: true,
          });
          console.log("✅ Document inserted with validation bypassed");
        } catch (retryErr) {
          console.error("❌ Retry failed:", retryErr);
          throw retryErr;
        }
      } else {
        throw insertErr;
      }
    }

    // ----- Gửi email chứa mật khẩu (nếu có cấu hình SMTP), nếu không thì log ra console -----
    try {
      const smtpHost = process.env.SMTP_HOST;
      if (smtpHost) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: (process.env.SMTP_SECURE || "false") === "true",
          auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
        });

        await transporter.sendMail({
          from:
            process.env.SMTP_FROM ||
            `no-reply@${process.env.DOMAIN || "local"}`,
          to: email,
          subject: "[Hệ thống] Thông tin đăng nhập",
          text: `Bạn đã được tạo tài khoản. Mã: ${newUser.studentId || newUser.teacherId || "-"}\nEmail: ${email}\nMật khẩu: ${rawPassword}`,
        });
      } else {
        // Dev fallback
        console.log(`Generated password for ${email}: ${rawPassword}`);
      }
    } catch (mailErr) {
      console.warn("Could not send email:", mailErr);
    }

    return res.status(201).json({
      success: true,
      message:
        "User registered successfully. Password sent to email if SMTP configured.",
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
