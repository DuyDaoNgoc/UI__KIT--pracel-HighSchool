import { Document } from "mongoose";

export type Role = "student" | "teacher" | "admin";

export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password: string;
  role: Role;
  dob?: Date;
  class?: string;
  schoolYear?: string;
  phone?: string;
  address?: string;
  avatar: string; // ✅ bắt buộc vì mongoose cần default
  createdAt: Date; // ✅ luôn có khi lưu vào DB
}

// Input khi tạo user
export type CreateUserInput = Omit<IUser, "_id" | "createdAt"> & {
  createdAt?: Date;
};

// Trả về FE (ẩn password)
export type SafeUser = Omit<IUser, "password">;

// ✅ alias cho mongoose
export type IUserDocument = IUser & Document;
