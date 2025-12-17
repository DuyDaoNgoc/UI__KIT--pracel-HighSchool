import { Schema, model } from "mongoose";
import { IUserDocument } from "../types/user";

// ===== User Schema =====
const UserSchema = new Schema<IUserDocument>(
  {
    // 🎯 ID riêng cho từng loại user
    studentId: {
      type: String,
      unique: true,
      sparse: true, // ✅ cho phép nhiều null
      required: function (this: IUserDocument) {
        return this.role === "student";
      },
    },
    teacherId: {
      type: String,
      unique: true,
      sparse: true, // ✅ fix duplicate key khi null
      required: function (this: IUserDocument) {
        return this.role === "teacher";
      },
    },
    parentId: {
      type: String,
      unique: true,
      sparse: true,
      required: function (this: IUserDocument) {
        return this.role === "parent";
      },
    },

    customId: { type: String },

    // 🎯 Thông tin cơ bản
    username: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // ✅ sparse: cho phép null
    password: { type: String },

    // 🎯 Vai trò
    role: {
      type: String,
      enum: ["student", "teacher", "admin", "parent"],
      default: "student",
      required: true,
    },

    // 🎯 Thông tin phụ
    dob: { type: Date },
    classCode: { type: String },
    major: { type: String },
    majors: [{ type: String }], // 🎯 Chuyên môn cho giáo viên (mảng)
    schoolYear: { type: String },
    phone: { type: String },
    address: { type: String },
    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },

    // 🎯 Quan hệ
    children: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // 🎯 Điểm số & học tập
    grades: [
      {
        subject: { type: String },
        score: { type: Number },
      },
    ],
    creditsTotal: { type: Number },
    creditsEarned: { type: Number },

    // 🎯 Thời khoá biểu
    schedule: [
      {
        day: { type: String },
        subject: { type: String },
        startTime: { type: String },
        endTime: { type: String },
      },
    ],

    // 🎯 Lớp được gán (cho giáo viên)
    assignedClass: [
      {
        grade: { type: String },
        classLetter: { type: String },
        major: { type: String },
        schoolYear: { type: String },
        classCode: { type: String },
        className: { type: String },
        role: { type: String },
      },
    ],

    // 🎯 Học phí
    tuitionTotal: { type: Number },
    tuitionPaid: { type: Number },
    tuitionRemaining: { type: Number },

    // 🎯 Trạng thái tài khoản
    isBlocked: { type: Boolean, default: false },

    // 🎯 Thông báo
    notifications: [
      {
        type: { type: String }, // e.g., "grade_submitted", "grade_report_submitted"
        title: { type: String },
        message: { type: String },
        score: { type: Number },
        subject: { type: String },
        class: { type: String },
        teacher: { type: String },
        report: { type: Schema.Types.Mixed }, // For admin reports
        timestamp: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true, // ✅ tự thêm createdAt & updatedAt
  },
);

// ===== Pre-save Hook =====
UserSchema.pre("save", function (next) {
  if (this.isNew) {
    if (this.role === "student" && !this.studentId) {
      this.studentId = "STU-" + Math.floor(100000 + Math.random() * 900000);
    }
    if (this.role === "teacher" && !this.teacherId) {
      this.teacherId = "TEA-" + Math.floor(100000 + Math.random() * 900000);
    }
    if (this.role === "parent" && !this.parentId) {
      this.parentId = "PAR-" + Math.floor(100000 + Math.random() * 900000);
    }
  }
  next();
});

export const User = model<IUserDocument>("User", UserSchema);
export default User;
