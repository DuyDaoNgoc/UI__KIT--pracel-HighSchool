import { Document, ObjectId } from "mongodb";

export type Role = "student" | "teacher" | "admin";

export interface IUser {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string; // hashed
  role: Role;
  dob?: Date;
  class?: string; // lớp
  schoolYear?: string; // niên khóa
  phone?: string;
  address?: string;
  createdAt?: Date;
}

// 👉 Đây là cho mongoose Document
export interface IUserDocument extends IUser, Document {}

// 👉 Các type tiện ích
export type CreateUserInput = Omit<IUser, "_id" | "createdAt">;
export type SafeUser = Omit<IUser, "password">;
