import { ObjectId } from "mongodb";

export type Role = "student" | "teacher" | "admin" | "parent";

export interface IUser {
  _id?: ObjectId;
  customId?: string;
  username: string;
  email: string;
  password: string;
  role: Role;
  dob?: Date;
  class?: string;
  schoolYear?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  createdAt?: Date;
  children?: ObjectId[];

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

  teacherId?: ObjectId;
}

export interface IUserDocument extends IUser {}

export interface CreateUserInput {
  customId?: string;
  username: string;
  email: string;
  password: string;
  role?: Role;
  dob?: Date;
  class?: string;
  schoolYear?: string;
  phone?: string;
  address?: string;
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

  teacherId?: string; // client gửi string, server convert sang ObjectId khi lưu
}

// SafeUser không kế thừa trực tiếp IUser, ép kiểu ObjectId -> string
export type SafeUser = Omit<
  IUser,
  "password" | "children" | "_id" | "teacherId"
> & {
  _id: string;
  children: string[];
  teacherId?: string;
};

export const toSafeUser = (user: IUser & { _id: ObjectId }): SafeUser => ({
  _id: user._id.toString(),
  customId: user.customId || "",
  username: user.username,
  email: user.email,
  role: user.role,
  dob: user.dob,
  class: user.class,
  schoolYear: user.schoolYear,
  phone: user.phone,
  address: user.address,
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
  teacherId: user.teacherId?.toString(), // ép ObjectId sang string
});
