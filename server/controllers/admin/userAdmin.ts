import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "../../models/User";
import { connectDB } from "../../configs/db";

interface ResetParams {
  userId?: string;
  studentId?: string;
  teacherId?: string;
  useCode?: boolean; // if true (default) set password to code, otherwise random
}

export async function resetUserPasswordByAdmin(params: ResetParams) {
  const { userId, studentId, teacherId, useCode = true } = params;
  const db = await connectDB();

  // Find user
  let user: any = null;
  if (userId) {
    if (ObjectId.isValid(userId)) {
      user = await User.findById(new ObjectId(userId));
    }
  } else if (studentId) {
    user = await User.findOne({ studentId: String(studentId) });
  } else if (teacherId) {
    user = await User.findOne({ teacherId: String(teacherId) });
  } else {
    throw new Error("Missing identifier (userId or studentId or teacherId)");
  }

  if (!user) {
    return { success: false, message: "User not found" };
  }

  // Determine new password
  let newPasswordPlain = "";
  if (useCode) {
    newPasswordPlain = user.studentId || user.teacherId || "";
  }
  if (!newPasswordPlain) {
    newPasswordPlain = Math.random().toString(36).slice(2, 10); // random 8 chars
  }

  const hashed = await bcrypt.hash(newPasswordPlain, 10);
  await User.updateOne({ _id: user._id }, { password: hashed });

  // Send email to user if email exists, otherwise log
  try {
    if (process.env.SMTP_HOST && user.email) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: (process.env.SMTP_SECURE || "false") === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME || "Trường Đại Học .H"}" <${process.env.SMTP_FROM || `no-reply@${process.env.DOMAIN || "local"}`}>`,
        to: user.email,
        subject: "[Hệ thống] Mật khẩu mới",
        text: `Mật khẩu mới của bạn: ${newPasswordPlain}`,
      });
    } else {
      console.log(
        `Admin reset password for ${user.email || user._id}: ${newPasswordPlain}`,
      );
    }
  } catch (err) {
    console.warn("Could not send reset email:", err);
  }

  return {
    success: true,
    message: "Password reset successfully",
    email: user.email || null,
  };
}
