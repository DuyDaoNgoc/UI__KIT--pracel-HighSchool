export interface IClass {
  classId: string; // Bắt buộc có _id
  grade: string; // Bắt buộc
  classLetter: string; // Bắt buộc
  major?: string;
  classCode: string; // Bắt buộc
  teacherName?: string;
  studentIds: string[]; // Luôn có (dù có thể rỗng)
}
