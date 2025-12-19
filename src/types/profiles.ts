export interface IUserProfile {
  _id: string;
  username: string;
  email?: string;
  role: string;
  class?: string;
  schoolYear?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  children?: string[];

  // optional identifiers for teacher / student accounts
  teacherId?: string;
  studentId?: string;
  assignedClass?: Array<{
    grade: string;
    classLetter: string;
    major: string;
    schoolYear: string;
    classCode: string;
    role?: string;
  }>;

  // ✅ Bổ sung để không lỗi khi nhận dữ liệu từ backend
  classCode?: { className: string; grade: string } | string;
  major?: { name: string; code: string } | string;
  majors?: string[]; // chuyên ngành cho giáo viên

  // ✅ Thêm các properties cho ProfileInfo
  dob?: string; // Date of birth
  grade?: string; // Grade/Class
  gpa?: number; // GPA
  credits?: number; // Credits
}

export interface IGrade {
  subject: string;
  score: number;
}

export interface ICredit {
  total: number;
  earned: number;
}

export interface IScheduleItem {
  day: string;
  subjects: string[];
}

export interface ITuition {
  total: number;
  paid: number;
  remaining: number;
  daycare?: number; // tiền bán trú
  boarding?: number;
}
