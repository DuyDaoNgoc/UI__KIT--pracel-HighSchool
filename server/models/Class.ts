import mongoose, { Schema, Document, Types } from "mongoose";

// Interface
export interface IClass extends Document {
  grade: string;
  classLetter: string;
  major: string;
  classCode: string;
  teacherName?: string; // Tên giáo viên
  teacherId?: string; // ID giáo viên, đồng bộ với User.teacherId
  studentIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Schema
const ClassSchema = new Schema<IClass>(
  {
    grade: { type: String, required: true },
    classLetter: { type: String, required: true },
    major: { type: String, required: true },
    classCode: { type: String, required: true, unique: true },
    teacherName: { type: String, default: null },
    teacherId: { type: String, default: null }, // để đồng bộ với User.teacherId
    studentIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Index cho classCode + major để đảm bảo uniqueness
ClassSchema.index({ classCode: 1, major: 1 }, { unique: true });

export default mongoose.model<IClass>("Class", ClassSchema);
