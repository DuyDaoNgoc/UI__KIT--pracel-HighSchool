// ===== Vai trò user =====
export type Role = "student" | "teacher" | "admin" | "parent";

// ===== User nhận từ backend =====
export interface User {
  _id: string;

  // 🎯 ID riêng cho từng loại user
  studentId?: string;
  teacherId?: string | null;
  parentId?: string | null;
  customId?: string;

  // 🎯 Thông tin cơ bản
  username: string;
  email?: string;
  role: Role;
  dob?: string;
  class?: string;
  classCode?: string; // ✅ thêm mã lớp duy nhất
  classLetter?: string; // ✅ thêm ký hiệu lớp (A, B, C…)
  major?: string; // ✅ chuyên ngành / tổ hợp môn
  schoolYear?: string;
  phone?: string;
  address?: string;
  gender?: "Nam" | "Nữ" | "other";
  avatar?: string;

  // 🎯 Metadata
  createdAt: string;

  // 🎯 Quan hệ
  children?: string[] | null;
  teacherName?: string; // ✅ để join nhanh với lớp

  // 🎯 Học tập
  grades?: { subject: string; score: number }[];
  creditsTotal?: number;
  creditsEarned?: number;

  // 🎯 Thời khóa biểu
  schedule?: {
    day: string;
    subject: string;
    startTime: string;
    endTime: string;
  }[];

  // 🎯 Học phí
  tuitionTotal?: number;
  tuitionPaid?: number;
  tuitionRemaining?: number;
}

// ===== SafeUser (FE convert lại) =====
// createdAt: string -> Date
// children: null -> []
export interface SafeUser extends Omit<User, "createdAt" | "children"> {
  createdAt: Date;
  children: string[];
}

// ===== API Responses =====

// ✅ Login API response
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

// ✅ Register API response
export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
}
