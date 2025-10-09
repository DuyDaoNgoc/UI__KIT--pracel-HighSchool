import { ObjectId } from "mongodb";

export interface IClass {
  _id?: ObjectId | string;
  schoolYear: string; // 🎯 năm học
  classLetter: string;
  major: string;
  classCode: string;
  teacherName?: string | null;
  studentIds: Array<ObjectId | string>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Giữ nguyên — chỉ extend lại để dùng đúng kiểu mongoose.Document nếu cần
export interface IClassDocument extends IClass {}
