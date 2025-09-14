export type Role = "student" | "teacher" | "admin" | "parent";

// User nhận từ backend
export interface User {
  _id: string;
  studentId?: string;
  teacherId?: string | null;
  parentId?: string | null;
  customId?: string;
  username: string;
  email?: string;
  role: Role;
  dob?: string;
  class?: string;
  schoolYear?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  createdAt: string;
  children?: string[] | null;
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

// SafeUser = FE convert lại từ string -> Date và optional children
export interface SafeUser extends Omit<User, "createdAt"> {
  createdAt: Date;
  children: string[];
}

// ✅ Login API response – chỉ thêm success
export interface LoginResponse {
  success: boolean; // <-- bổ sung
  message: string;
  token: string;
  user: User;
}

// ✅ Register API response – chỉ thêm success
export interface RegisterResponse {
  success: boolean; // <-- bổ sung
  message: string;
  user: User;
}
