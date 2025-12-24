import { ObjectId } from "mongodb";
import { Document, Types } from "mongoose";

/**
 * Vai trò user (Role)
 * - Dùng chung cho cả BE và FE
 */
export type Role = "student" | "teacher" | "admin" | "parent";

/* ===========================================================
   ===== Interface cơ bản cho User =====
   - Dùng cho BE <-> FE (DTO / response)
   =========================================================== */
export interface IUser {
  // ===== ID & định danh =====
  _id?: ObjectId | string;
  studentId?: string;
  teacherId?: string | null;
  // Reference IDs to Teacher / Student documents
  teacherRef?: ObjectId | string | null;
  studentRef?: ObjectId | string | null;
  parentId?: string | null;
  customId?: string;

  // ===== Thông tin cơ bản =====
  username: string;
  email?: string;
  password?: string;
  role: Role;
  name?: string;

  // ===== Thông tin cá nhân =====
  dob?: Date | string;
  gender?: "Nam" | "Nữ" | "other";
  phone?: string;
  address?: string;
  residence?: string;
  location?: string;
  avatar?: string;
  createdAt?: Date;

  // ===== Thông tin lớp / học tập =====
  class?: string;
  classCode?: string;
  classLetter?: string;
  major?: string;
  grade?: string;
  schoolYear?: string;
  teacherName?: string;

  // ===== Quan hệ & con cái =====
  children?: (ObjectId | string)[];

  // ===== Điểm & học tập =====
  grades?: { subject: string; score: number }[];
  creditsTotal?: number;
  creditsEarned?: number;

  // ===== Thời khoá biểu =====
  schedule?: {
    day: string;
    subject: string;
    startTime: string;
    endTime: string;
  }[];

  // ===== Lớp được gán (cho giáo viên) =====
  assignedClass?: {
    grade: string;
    classLetter: string;
    majors: string; // 🔧 FIX: khớp schema
    schoolYear: string;
    classCode: string;
    className?: string;
    role?: string; // 🔧 FIX: khớp schema
  }[];

  // ===== Học phí =====
  tuitionTotal?: number;
  tuitionPaid?: number;
  tuitionRemaining?: number;

  // ===== Bảo mật / khóa tài khoản =====
  loginAttempts?: number;
  lockUntil?: number;
  isBlocked?: boolean;

  // ===== BỔ SUNG ĐỂ KHỚP SCHEMA =====
  majors?: string[]; // 🔧 FIX: schema có majors[]
  notifications?: {
    type?: string;
    title?: string;
    message?: string;
    score?: number;
    subject?: string;
    class?: string;
    teacher?: string;
    report?: any;
    timestamp?: Date;
    read?: boolean;
  }[];
}

/* ===========================================================
   ===== Interface Mongoose Document (CHỈ PHẦN NÀY CỰC QUAN TRỌNG)
   =========================================================== */
export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}

/* ===========================================================
   ===== Input khi tạo user =====
   =========================================================== */
export interface CreateUserInput {
  studentId?: string;
  teacherId?: string | null;
  parentId?: string | null;
  customId?: string;
  username: string;
  email?: string;
  password?: string;
  role?: Role;
  dob?: Date | string;
  class?: string;
  classCode?: string;
  grade?: string;
  major?: string;
  schoolYear?: string;
  phone?: string;
  address?: string;
  residence?: string;
  location?: string;
  avatar?: string;
  createdAt?: Date;
  children?: string[];
  grades?: { subject: string; score: number }[];
  creditsTotal?: number;
  creditsEarned?: number;
  schedule?: {
    day: string;
    subject: string;
    startTime: string;
    endTime: string;
  }[];
  tuitionTotal?: number;
  tuitionPaid?: number;
  tuitionRemaining?: number;
  loginAttempts?: number;
  lockUntil?: number;
  teacherRef?: ObjectId | string | null;
  studentRef?: ObjectId | string | null;
}

/* ===========================================================
   ===== SafeUser trả về FE =====
   =========================================================== */
export type SafeUser = Omit<IUser, "password" | "_id" | "children"> & {
  _id: string;
  children: string[];
  teacherId?: string | null;
  parentId?: string | null;
  assignedClass?: any[];
  teacherRef?: string | null;
  studentRef?: string | null;
};

/* ===========================================================
   ===== Convert IUser -> SafeUser
   =========================================================== */
export const toSafeUser = (
  user: IUser & { _id: ObjectId | string },
): SafeUser => ({
  _id: user._id.toString(),
  studentId: user.studentId,
  teacherId: user.teacherId ?? null,
  parentId: user.parentId ?? null,
  customId: user.customId || "",
  username: user.username,
  email: user.email || "",
  role: user.role || "student",
  name: user.name || "",
  dob: user.dob,
  class: user.class || undefined,
  classCode: (user as any).classCode || "",
  classLetter: (user as any).classLetter || "",
  major: (user as any).major || "",
  grade: user.grade || "",
  schoolYear: user.schoolYear || "",
  teacherName: (user as any).teacherName || "",
  phone: user.phone || "",
  address: user.address || "",
  residence: user.residence || "",
  location: (user as any).location || "",
  avatar:
    user.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  createdAt: user.createdAt || new Date(),
  children: user.children?.map((c) => c.toString()) || [],
  grades: user.grades || [],
  creditsTotal: user.creditsTotal || 0,
  creditsEarned: user.creditsEarned || 0,
  schedule: user.schedule || [],
  tuitionTotal: user.tuitionTotal || 0,
  tuitionPaid: user.tuitionPaid || 0,
  tuitionRemaining: user.tuitionRemaining || 0,
  assignedClass: (user as any).assignedClass || [],
  teacherRef: (user as any).teacherRef
    ? (user as any).teacherRef.toString()
    : null,
  studentRef: (user as any).studentRef
    ? (user as any).studentRef.toString()
    : null,
});
