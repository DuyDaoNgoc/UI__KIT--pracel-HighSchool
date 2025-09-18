// server/types/user.ts
import { ObjectId } from "mongodb";

/**
 * Vai trò user (Role)
 * - Dùng chung cho cả BE và FE
 */
export type Role = "student" | "teacher" | "admin" | "parent";

/* ===========================================================
   ===== Interface cơ bản cho User =====
   - Đây là model dữ liệu user chung (BE <-> FE mapping)
   - Không bắt buộc mọi field đều tồn tại (hầu hết optional)
   =========================================================== */
export interface IUser {
  // ===== ID & định danh =====
  _id?: ObjectId | string; // DB có ObjectId, FE thường dùng string
  studentId?: string; // mã học sinh (STU-xxxxx)
  teacherId?: string | null; // mã giáo viên (TEA-xxxxx)
  parentId?: string | null; // mã phụ huynh (PAR-xxxxx)
  customId?: string; // id do hệ thống tùy biến

  // ===== Thông tin cơ bản =====
  username: string; // tên đăng nhập / hiển thị chính
  email?: string; // email (optional)
  password?: string; // mật khẩu (chỉ lưu server)
  role: Role; // vai trò user
  name?: string; // tên đầy đủ (thêm để đồng bộ với chỗ dùng `name`)

  // ===== Thông tin cá nhân =====
  dob?: Date | string; // ngày sinh
  gender?: "Nam" | "Nữ" | "other"; // giới tính
  phone?: string;
  address?: string;
  residence?: string;
  avatar?: string; // url avatar
  createdAt?: Date; // timestamp (server sẽ set)

  // ===== Thông tin lớp / học tập =====
  // Lưu các trường liên quan lớp/hệ học để controller có thể truy xuất trực tiếp
  class?: string; // classLetter (như "A") - alias cũ
  classCode?: string; // mã lớp đầy đủ (ví dụ "10A1CNTT")
  classLetter?: string; // ký hiệu lớp (A, B, C...)
  major?: string; // chuyên ngành / tổ hợp môn
  grade?: string; // khối (ví dụ "10", "11")
  schoolYear?: string; // niên khóa (ví dụ "2024-2025")
  teacherName?: string; // tên giáo viên được đồng bộ nhanh (string)

  // ===== Quan hệ & con cái =====
  children?: (ObjectId | string)[]; // danh sách con (với parent role)

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

  // ===== Học phí =====
  tuitionTotal?: number;
  tuitionPaid?: number;
  tuitionRemaining?: number;

  // ===== Bảo mật / khóa tài khoản =====
  loginAttempts?: number; // số lần login thất bại
  lockUntil?: number; // timestamp đến khi tài khoản bị khóa
}

/* ===========================================================
   ===== Interface Mongoose Document =====
   - Giữ kế thừa IUser như cấu trúc của bạn
   - Nếu cần, có thể mở rộng thêm Document của mongoose sau này
   =========================================================== */
export interface IUserDocument extends IUser {} // kế thừa IUser

/* ===========================================================
   ===== Input khi tạo user =====
   - Kiểu dữ liệu dùng cho API create user
   - Giữ tương tự IUser nhưng loại bỏ _id/createdAt/children raw
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

  // 🎯 Lưu ý: ở đây là kiểu dữ liệu (number), không phải schema definition
  loginAttempts?: number;
  lockUntil?: number;
}

/* ===========================================================
   ===== SafeUser trả về FE =====
   - Loại bỏ password, _id luôn string, children luôn array string
   =========================================================== */
export type SafeUser = Omit<IUser, "password" | "_id" | "children"> & {
  _id: string; // luôn string
  children: string[]; // luôn mảng string (không null)
  teacherId?: string | null;
  parentId?: string | null;
};

/* ===========================================================
   ===== Convert IUser -> SafeUser =====
   - Hàm tiện ích chuyển ObjectId -> string, xử lý default values
   - Nhận `user` có _id kiểu ObjectId để chắc chắn convert đúng
   =========================================================== */
export const toSafeUser = (user: IUser & { _id: ObjectId }): SafeUser => ({
  _id: user._id.toString(),
  studentId: user.studentId,
  teacherId: user.teacherId ?? null,
  parentId: user.parentId ?? null,
  customId: user.customId || "",
  username: user.username,
  email: user.email || "",
  role: user.role,
  name: user.name || "",
  dob: user.dob,
  class: user.class,
  // --- các trường lớp/học tập đầy đủ để controller dùng ---
  classCode: (user as any).classCode || undefined,
  classLetter: (user as any).classLetter || undefined,
  major: (user as any).major || undefined,
  grade: user.grade,
  schoolYear: user.schoolYear,
  teacherName: (user as any).teacherName || undefined,
  // --- liên hệ và cá nhân ---
  phone: user.phone,
  address: user.address,
  residence: user.residence,
  avatar: user.avatar,
  createdAt: user.createdAt || new Date(),
  // children: convert ObjectId -> string nếu cần
  children: user.children?.map((c) => c.toString()) || [],
  // --- học tập ---
  grades: user.grades || [],
  creditsTotal: user.creditsTotal || 0,
  creditsEarned: user.creditsEarned || 0,
  schedule: user.schedule || [],
  // --- học phí ---
  tuitionTotal: user.tuitionTotal || 0,
  tuitionPaid: user.tuitionPaid || 0,
  tuitionRemaining: user.tuitionRemaining || 0,
});
