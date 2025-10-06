import { ObjectId } from "mongodb";

export interface IClass {
  _id?: ObjectId | string;
  schoolYear: string;
  classLetter: string;
  major: string;
  classCode: string;
  teacherName?: string | null;
  studentIds: (ObjectId | string)[];
  createdAt?: Date;
  updatedAt?: Date;
}
