export type Role = "student" | "teacher" | "admin";

export interface User {
  _id: string;
  username: string;
  email: string;
  role: Role;
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
