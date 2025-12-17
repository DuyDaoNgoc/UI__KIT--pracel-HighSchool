// server/controllers/admin/createStudent.ts
import { Request, Response } from "express";

import { connectDB } from "../../../configs/db";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "../../../models/User";
import StudentModel from "../../../models/Student";

import { ObjectId } from "mongodb";

import { syncStudentToUser } from "../../../utils/syncUserData";

import { getIo } from "../../../utils/socketio";

export const createStudent = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();

    console.log("📥 [createStudent] Received body:", req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không nhận được dữ liệu từ client.",
        data: null,
      });
    }

    const {
      studentId,
      name,
      dob,
      gender,
      address,
      residence,
      phone,
      grade,
      classLetter,
      schoolYear,
      major,
      classCode,
      email,
    } = req.body;

    // Check các thông tin bắt buộc
    if (!studentId || !name || !dob || !grade || !classLetter || !schoolYear) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin bắt buộc (studentId, name, dob, grade, classLetter, schoolYear).",
        data: req.body,
      });
    }

    // Chuyển dob thành Date object
    const parsedDob = new Date(dob);

    if (isNaN(parsedDob.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Ngày sinh không hợp lệ. Vui lòng dùng định dạng YYYY-MM-DD.",
        data: {
          dob,
        },
      });
    }

    // Check unique studentId
    const existingStudent = await StudentModel.findOne({
      studentId,
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: `Mã học sinh ${studentId} đã tồn tại. Vui lòng kiểm tra lại.`,
      });
    }

    // Tạo classCode an toàn nếu chưa có (🔥 Chỉnh sửa duy nhất ở đây)
    const safeClassCode =
      classCode ??
      `${String(grade)}${String(classLetter)}-${String(major ?? "")
        .split(/\s+/)
        .map((w: string) => w[0]?.toUpperCase() || "")
        .join("")}`;

    const newStudent = {
      studentId: String(studentId),
      name: String(name),
      username: String(name),
      dob: parsedDob,
      gender: String(gender ?? ""),
      email: email ? String(email).trim().toLowerCase() : "",
      address: String(address ?? ""),
      residence: String(residence ?? ""),
      phone: String(phone ?? ""),
      grade: String(grade),
      classLetter: String(classLetter),
      schoolYear: String(schoolYear),
      major: String(major ?? ""),
      classCode: String(safeClassCode),
      className: `${String(grade)} ${String(classLetter)} - ${String(
        major ?? "",
      )}`,
      role: "student",
      avatar: "",
      teacherId: "",
      parentId: "",
    };

    console.log("🚀 [createStudent] Insert student:", newStudent);

    // Insert student using StudentModel instead of raw collection
    const createdStudent = await StudentModel.create(newStudent);

    // 🔥 LUÔN tạo User tài khoản cho học sinh, dù có email hay không
    let emailSent = false;
    let rawPasswordToReturn: string | null = null;

    try {
      const { email } = req.body as any;
      const rawPassword = newStudent.studentId; // mật khẩu mặc định = mã học sinh
      rawPasswordToReturn = rawPassword;

      // Chỉ query theo studentId (email có thể rỗng nên không query theo email)
      const existing = await User.findOne({
        studentId: newStudent.studentId,
      });

      // Nếu user chưa tồn tại, tạo mới
      if (!existing) {
        const hashed = await bcrypt.hash(rawPassword, 10);

        const userEmail = email
          ? String(email).trim().toLowerCase()
          : `${newStudent.studentId}@student.local`;

        await User.create({
          username: newStudent.username,
          email: userEmail,
          password: hashed,
          role: "student",
          studentId: newStudent.studentId,
          createdAt: new Date(),
        } as any);

        console.log(
          `✅ Auto-created user for ${newStudent.studentId} with email ${userEmail}`,
        );
      } else {
        console.log(
          `ℹ️ User already exists for ${newStudent.studentId}, skipping creation`,
        );
      }

      // 🔥 Gửi email mật khẩu nếu SMTP cấu hình VÀ có email thật (không default)
      if (email) {
        try {
          console.log("📧 [EMAIL] SMTP_HOST:", process.env.SMTP_HOST);
          console.log("📧 [EMAIL] SMTP_PORT:", process.env.SMTP_PORT);
          console.log("📧 [EMAIL] SMTP_USER:", process.env.SMTP_USER);

          if (process.env.SMTP_HOST) {
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

            console.log("📧 [EMAIL] Attempting to send email to:", email);

            await transporter.sendMail({
              from:
                process.env.SMTP_FROM ||
                `no-reply@${process.env.DOMAIN || "local"}`,
              to: email,
              subject: "[Hệ thống] Tài khoản học sinh",
              html: `<p>Tài khoản của em ${newStudent.name} đã được tạo:</p>
                  <ul>
                    <li><strong>Mã học sinh:</strong> ${newStudent.studentId}</li>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Mật khẩu:</strong> ${rawPassword}</li>
                  </ul>
                  <p>Em vui lòng đăng nhập và đổi mật khẩu ngay nhé.</p>`,
            });
            emailSent = true;

            console.log(`✅ [EMAIL] Password email sent to ${email}`);
          } else {
            console.log(
              `⚠️ [EMAIL] SMTP not configured. Password for ${newStudent.studentId}: ${rawPassword}`,
            );
            // SMTP chưa cấu hình, hiển thị mật khẩu để admin copy
            emailSent = false;
          }
        } catch (mailErr) {
          console.warn("⚠️ [EMAIL] Could not send password email:", mailErr);
          emailSent = false;
        }
      } else {
        console.log(
          `ℹ️ [EMAIL] No email provided, user created but no email sent (default email: ${newStudent.studentId}@student.local)`,
        );
      }
    } catch (err) {
      console.error("❌ Error handling user for student:", err);
    }

    // ✅ Auto-sync student to user collection (AFTER user is created/updated)
    await syncStudentToUser(
      createdStudent.toObject ? createdStudent.toObject() : createdStudent,
    );

    // Note: Student is automatically added to class via StudentModel pre-save hook
    // No need to manually add here

    // Lấy danh sách tất cả students mới nhất
    const allStudents = await StudentModel.find().sort({
      createdAt: -1,
    });

    // Emit socket events: notify the specific student room and admins
    try {
      const io = getIo();

      if (io) {
        const room = `user:${createdStudent.studentId}`;

        io.to(room).emit("student:created", {
          student: createdStudent,
        });

        io.to("role:admin").emit("student:created", {
          student: createdStudent,
        });
      }
    } catch (emitErr) {
      console.warn("⚠️ [createStudent] Socket emit failed:", emitErr);
    }

    return res.status(201).json({
      success: true,
      message: "Học sinh đã được tạo thành công.",
      data: {
        student: createdStudent,
        students: allStudents,
        // trả về thông tin gửi email để frontend có thể hiển thị mật khẩu khi cần
        emailSent,
        rawPassword: rawPasswordToReturn,
      },
    });
  } catch (error: any) {
    console.error("❌ [createStudent] Unexpected error:", error);

    if (error?.errInfo?.details?.schemaRulesNotSatisfied) {
      console.error(
        "📋 Schema rules not satisfied:",
        JSON.stringify(error.errInfo.details.schemaRulesNotSatisfied, null, 2),
      );
    }

    return res.status(500).json({
      success: false,
      message: "Không thể tạo học sinh. Vui lòng thử lại sau.",
      errorDetail: {
        name: error?.name ?? null,
        message: error?.message ?? String(error),
        stack: error?.stack ?? null,
        details: error?.errInfo?.details ?? null,
      },
    });
  }
};

export default createStudent;
