// ========================
// Lớp được gán cho giáo viên
// ========================
export interface IAssignedClass {
  grade: string; // Khối
  classLetter: string; // Lớp
  major: string; // Ngành
  schoolYear: string; // Niên khóa
  classCode: string; // Mã lớp duy nhất
}

// ========================
// Giáo viên trong backend (MongoDB / Server)
// ========================
export interface ITeacher {
  _id: string;
  name: string;
  dob?: Date; // Backend luôn Date
  gender: "Nam" | "Nữ" | "other";
  phone?: string;
  address?: string;
  majors: string[]; // chuyên ngành
  subjectClasses?: string[]; // các môn phụ trách
  assignedClass?: IAssignedClass | null; // object class đầy đủ
  createdAt?: Date;
  updatedAt?: Date;
}

// ========================
// Giáo viên trả về frontend (API Response)
// ========================
export interface ICreatedTeacher {
  _id: string;
  name: string;
  dob?: string; // Frontend luôn string (yyyy-mm-dd)
  gender: "Nam" | "Nữ" | "other";
  phone?: string;
  address?: string;
  majors: string[];
  subjectClasses?: string[];
  assignedClass?: IAssignedClass | null; // object class đầy đủ
  createdAt?: string;
  updatedAt?: string;
}

// ========================
// Form state trên frontend
// ========================
export interface ITeacherForm {
  name: string;
  dob: string; // yyyy-mm-dd
  gender: "Nam" | "Nữ" | "other";
  phone?: string;
  address?: string;
  majors: string[];
  subjectClasses?: string[];
  assignedClassCode: string; // Người dùng nhập / chọn mã lớp
}
