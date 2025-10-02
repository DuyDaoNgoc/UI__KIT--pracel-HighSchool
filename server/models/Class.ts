import mongoose, { Schema, Document, Types } from "mongoose";

export interface IClass extends Document {
  grade: string;
  classLetter: string;
  schoolYear: string;
  major: string;
  classCode: string;
  teacherId?: Types.ObjectId | null; // 🔗 ref Teacher
  teacherName: string;
  studentIds: Types.ObjectId[]; // 🔗 ref User
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    grade: { type: String, required: true },
    classLetter: { type: String, required: true },
    schoolYear: { type: String, required: true },
    major: { type: String, required: true },
    classCode: { type: String, required: true }, // ❌ bỏ unique: true để tránh conflict
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
    studentIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    teacherName: { type: String, default: "" },
  },
  { timestamps: true }
);

// ✅ Index compound (classCode + major) mới là unique
ClassSchema.index({ classCode: 1, major: 1 }, { unique: true });

export default mongoose.model<IClass>("Class", ClassSchema);
