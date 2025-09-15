// backend/models/teacherModel.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITeacher extends Document {
  name: string;
  email: string;
  password: string; // nên hash
  assignedClassCode?: string; // lớp được gán
  createdAt: Date;
}

const TeacherSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    assignedClassCode: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<ITeacher>("Teacher", TeacherSchema);
