// src/types/student.ts

// Kiểu học sinh phía client
export interface ICreatedStudent {
  _id: string;
  studentId: string;
  name: string;
  dob?: string;
  address?: string;
  residence?: string;
  phone?: string;
  grade?: string;
  classLetter?: string;
  schoolYear?: string;
  teacherId?: string;
  major?: string;
  teacherName?: string;
  classCode?: string; // frontend generate
  gender?: "Nam" | "Nữ" | "other";
  createdAt?: string;
}
// Kiểu response khi tạo học sinh
export interface ICreateStudentResp {
  student?: ICreatedStudent;
  studentId?: string;
}
