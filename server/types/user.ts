// server/types/user.ts
import { ObjectId } from "mongodb";

export type Role = "student" | "teacher" | "admin" | "parent";

// ===== Interface cơ bản cho User =====
export interface IUser {
  _id?: ObjectId | string; // DB có ObjectId, FE có string
  studentId?: string;
  teacherId?: string | null;
  parentId?: string | null;
  customId?: string;
  username: string;
  email?: string; // optional
  password?: string; // optional
  role: Role;
  dob?: Date | string;
  class?: string; // classLetter
  schoolYear?: string;
  grade?: string;
  phone?: string;
  address?: string;
  residence?: string;
  avatar?: string;
  createdAt?: Date;
  children?: (ObjectId | string)[];
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
}

// ===== Interface Mongoose Document =====
export interface IUserDocument extends IUser {} // kế thừa IUser

// ===== Input khi tạo user =====
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
  class?: string; // classLetter
  schoolYear?: string;
  grade?: string;
  phone?: string;
  address?: string;
  residence?: string;
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
}

// ===== SafeUser trả về FE =====
export type SafeUser = Omit<IUser, "password" | "_id" | "children"> & {
  _id: string; // luôn string
  children: string[]; // luôn là mảng, không null
  teacherId?: string | null;
  parentId?: string | null;
};

// ===== Convert IUser -> SafeUser =====
export const toSafeUser = (user: IUser & { _id: ObjectId }): SafeUser => ({
  _id: user._id.toString(),
  studentId: user.studentId,
  teacherId: user.teacherId ?? null,
  parentId: user.parentId ?? null,
  customId: user.customId || "",
  username: user.username,
  email: user.email || "",
  role: user.role,
  dob: user.dob,
  class: user.class,
  schoolYear: user.schoolYear,
  grade: user.grade,
  phone: user.phone,
  address: user.address,
  residence: user.residence,
  avatar: user.avatar,
  createdAt: user.createdAt || new Date(),
  children: user.children?.map((c) => c.toString()) || [],
  grades: user.grades || [],
  creditsTotal: user.creditsTotal || 0,
  creditsEarned: user.creditsEarned || 0,
  schedule: user.schedule || [],
  tuitionTotal: user.tuitionTotal || 0,
  tuitionPaid: user.tuitionPaid || 0,
  tuitionRemaining: user.tuitionRemaining || 0,
});
