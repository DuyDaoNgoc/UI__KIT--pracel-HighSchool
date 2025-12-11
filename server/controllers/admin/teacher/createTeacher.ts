import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "../../../models/User";
import TeacherModel, {
  IAssignedClass,
  ITeacher,
} from "../../../models/teacherModel";
import ClassModel from "../../../models/Class";

/* ====================================================
   🔹 HÀM: generateTeacherId()
   ----------------------------------------------------
   - Sinh teacherId tự động dạng GV00001, GV00002, ...
   - Dò document cuối cùng (theo teacherId) và +1.
   - Không tạo trùng vì có unique index + kiểm tra trước khi lưu.
===================================================== */
const generateTeacherId = async (): Promise<string> => {
  const lastTeacher = await TeacherModel.findOne({}, { teacherId: 1 })
    .sort({ teacherId: -1 })
    .lean();
  if (!lastTeacher?.teacherId) return "GV00001";
  const lastNumber = parseInt(lastTeacher.teacherId.replace("GV", ""), 10);
  return "GV" + String(lastNumber + 1).padStart(5, "0");
};

/* ====================================================
   🔹 HÀM: normalizeArray()
   ----------------------------------------------------
   - Đảm bảo input (string hoặc mảng) luôn trả về string[].
   - Hỗ trợ nhập “Toán, Lý, Hóa” => ["Toán", "Lý", "Hóa"].
===================================================== */
const normalizeArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [val];
};

/* ====================================================
   🔹 API: createTeacher()
   ----------------------------------------------------
   - Tạo giáo viên mới, tự sinh teacherId, kiểm tra trùng.
   - Validate dữ liệu cơ bản: name, dob, gender.
   - Kiểm tra trùng email, assignedClassCode.
   - Cập nhật ClassModel nếu có assignedClassCode.
===================================================== */
export const createTeacher = async (req: Request, res: Response) => {
  try {
    const {
      teacherId,
      name,
      dob,
      gender,
      phone,
      address,
      majors,
      subjectClasses,
      assignedClassCode,
      email,
      degree,
      educationLevel,
      certificates,
      research,
      subject,
      avatar,
    } = req.body;

    // 🔸 Kiểm tra trường bắt buộc
    if (!name || !dob || !gender) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (name, dob, gender)",
      });
    }

    // 🔸 Sinh teacherId và kiểm tra trùng
    let finalTeacherId = teacherId?.trim() || (await generateTeacherId());
    let duplicateTeacher = await TeacherModel.findOne({
      $or: [
        { teacherId: finalTeacherId },
        { email: email?.trim().toLowerCase() || null },
      ],
    });

    // 🔁 Nếu bị trùng => tăng tiếp GVxxxxx
    while (duplicateTeacher) {
      const lastNumber = parseInt(finalTeacherId.replace("GV", ""), 10);
      finalTeacherId = "GV" + String(lastNumber + 1).padStart(5, "0");
      duplicateTeacher = await TeacherModel.findOne({
        teacherId: finalTeacherId,
      });
    }

    // 🔸 Kiểm tra trùng assignedClassCode (nếu có)
    let assignedClass: IAssignedClass | undefined;
    let finalAssignedClassCode: string | undefined = undefined;

    if (assignedClassCode?.trim()) {
      finalAssignedClassCode = assignedClassCode.trim();

      const existing = await TeacherModel.findOne({
        assignedClassCode: finalAssignedClassCode,
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Lớp ${finalAssignedClassCode} đã được gán cho giáo viên khác`,
        });
      }

      assignedClass = {
        grade: "",
        classLetter: "",
        major: "",
        schoolYear: "",
        classCode: finalAssignedClassCode as string,
      };
    }

    // 🔸 Chuẩn hóa dữ liệu để khớp schema
    const teacherData: ITeacher = new TeacherModel({
      teacherId: finalTeacherId,
      name: name.trim(),
      dob: new Date(dob),
      gender,
      phone: phone || "",
      address: address || "",
      majors: normalizeArray(majors),
      subjectClasses: normalizeArray(subjectClasses),
      email: email?.trim().toLowerCase() || undefined, // rỗng => undefined để không bị duplicate key
      degree: degree || "",
      educationLevel: educationLevel || "",
      certificates: normalizeArray(certificates),
      research: research || "",
      subject: normalizeArray(subject),
      avatar: avatar || "",
      assignedClassCode: finalAssignedClassCode,
      assignedClass,
    });

    await teacherData.save();

    // 🔸 Nếu có lớp chủ nhiệm => cập nhật ClassModel
    if (finalAssignedClassCode) {
      let cls = await ClassModel.findOne({ classCode: finalAssignedClassCode });
      if (!cls) {
        cls = await ClassModel.create({
          grade: "",
          classLetter: "",
          schoolYear: "",
          major: "",
          classCode: finalAssignedClassCode,
          teacherId: teacherData._id,
          teacherName: teacherData.name,
          studentIds: [],
          className: "",
        });
      } else {
        cls.teacherId = teacherData._id as mongoose.Types.ObjectId;
        cls.teacherName = teacherData.name;
        await cls.save();
      }
    }

    // ✅ Thành công
    // Nếu có email, auto tạo user cho giáo viên
    let emailSent = false;
    let rawPasswordToReturn: string | null = null;
    if (teacherData.email) {
      try {
        const rawPassword = teacherData.teacherId;
        rawPasswordToReturn = rawPassword;

        const existing = await User.findOne({
          $or: [
            { email: teacherData.email },
            { teacherId: teacherData.teacherId },
          ],
        });

        // Nếu user chưa tồn tại, tạo mới
        if (!existing) {
          const hashed = await bcrypt.hash(rawPassword, 10);
          await User.create({
            username: teacherData.name,
            email: teacherData.email,
            password: hashed,
            role: "teacher",
            teacherId: teacherData.teacherId,
            createdAt: new Date(),
          } as any);
          console.log(
            `✅ Auto-created user for ${teacherData.email} with teacherId ${teacherData.teacherId}`,
          );
        } else {
          console.log(
            `ℹ️ User already exists for email/teacherId, reusing account`,
          );
        }

        // 🔥 LUÔN gửi email mật khẩu dù user mới hay cũ
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
                ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                : undefined,
            });

            console.log(
              "📧 [EMAIL] Attempting to send email to:",
              teacherData.email,
            );

            await transporter.sendMail({
              from:
                process.env.SMTP_FROM ||
                `no-reply@${process.env.DOMAIN || "local"}`,
              to: teacherData.email,
              subject: "[Hệ thống] Tài khoản giáo viên",
              html: `<p>Tài khoản của bạn ${teacherData.name} đã được tạo:</p>
<ul>
<li><strong>Mã giáo viên:</strong> ${teacherData.teacherId}</li>
<li><strong>Email:</strong> ${teacherData.email}</li>
<li><strong>Mật khẩu:</strong> ${rawPassword}</li>
</ul>
<p>Vui lòng đăng nhập và đổi mật khẩu ngay.</p>`,
            });
            emailSent = true;
            console.log(
              `✅ [EMAIL] Password email sent to ${teacherData.email}`,
            );
          } else {
            console.log(
              `⚠️ [EMAIL] SMTP not configured. Password for ${teacherData.teacherId}: ${rawPassword}`,
            );
            emailSent = false;
          }
        } catch (mailErr) {
          console.warn("⚠️ [EMAIL] Could not send password email:", mailErr);
          emailSent = false;
        }
      } catch (err) {
        console.error("❌ Error handling user for teacher:", err);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Thêm giáo viên thành công",
      data: {
        teacher: teacherData,
        emailSent,
        rawPassword: rawPasswordToReturn,
      },
    });
  } catch (error: any) {
    console.error("❌ Lỗi tạo giáo viên:", error);
    if (error?.code === 11000) {
      // Xử lý lỗi duplicate key (index unique)
      return res.status(409).json({
        success: false,
        message: `Giá trị trùng lặp: ${JSON.stringify(error.keyValue)}`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      errorDetail: error?.message ?? String(error),
    });
  }
};

export default createTeacher;
