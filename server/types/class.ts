import { ObjectId } from "mongodb";

export interface IClass {
  _id?: ObjectId | string;
  schoolYear: string; // 🎯 thêm field này
  classLetter: string;
  major: string;
  classCode: string;
  teacherName?: string | null;
  studentIds: (ObjectId | string)[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IClassDocument extends IClass {}
