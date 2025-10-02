// ========================
// Mã lớp (class) được gán cho giáo viên
// ========================
export interface IAssignedClass {
  grade: string; // Khối
  classLetter: string; // Lớp
  major: string; // Ngành
  schoolYear: string; // Niên khóa
  classCode: string; // Mã lớp duy nhất
}

// ========================
// Giáo viên trong database (backend)
// ========================
export interface ITeacher {
  _id: string;
  name: string;
  dob?: Date;
  gender: "male" | "female" | "other";
  phone?: string;
  address?: string;
  majors: string[]; // chuyên ngành
  subjectClasses?: string[]; // các môn phụ trách
  assignedClass?: IAssignedClass | null; // gán class object trực tiếp
  createdAt?: Date;
  updatedAt?: Date;
}

// ========================
// Giáo viên trả về frontend (API Response)
// ========================
export interface ICreatedTeacher {
  _id: string;
  name: string;
  dob?: string; // frontend luôn dùng string yyyy-mm-dd
  gender: "male" | "female" | "other";
  phone?: string;
  address?: string;
  majors: string[];
  subjectClasses?: string[];
  assignedClass?: IAssignedClass | null;
  assignedClassCode?: string; // tiện truy cập nhanh (nếu cần lọc theo class)
  createdAt?: string;
  updatedAt?: string;
}

// ========================
// Form state trên frontend
// ========================
export interface ITeacherForm {
  name: string;
  dob: string; // yyyy-mm-dd
  gender: "male" | "female" | "other";
  phone?: string;
  address?: string;
  majors: string[];
  subjectClasses?: string[];
  assignedClassCode: string; // user chỉ nhập mã lớp
}
