export type Role = "student" | "teacher" | "admin" | "parent";

export interface User {
  _id: string;
  username: string;
  email: string;
  role: Role;
  dob?: string;
  class?: string;
  schoolYear?: string;
  phone?: string;
  address?: string;
  avatar: string;
  createdAt: string; // từ API trả về là string
  children?: string[];
}

// SafeUser = FE convert lại
export interface SafeUser extends Omit<User, "createdAt"> {
  createdAt: Date;
  children?: string[];
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}
