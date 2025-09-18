// src/types/teacher.ts
export interface ITeacher {
  _id: string; // MongoDB ID
  name: string; // Tên giáo viên
  email?: string; // Email (nếu có)
  phone?: string; // Số điện thoại
  address?: string; // Địa chỉ
  dob?: string; // Ngày sinh
  gender?: "male" | "female" | "other";
  role?: "teacher" | "admin"; // Quyền
  majors: string[]; // Các ngành phụ trách
  assignedClassCode?: string; // Lớp chủ nhiệm (chỉ 1 lớp)
  subjectClasses?: string[]; // Các lớp phụ trách bộ môn
  createdAt?: Date;
}
