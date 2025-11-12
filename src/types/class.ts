import { ObjectId } from "mongodb";
import { join } from "node:path";

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
