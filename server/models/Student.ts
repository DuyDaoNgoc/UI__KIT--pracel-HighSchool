import mongoose, { Document, Schema } from "mongoose";

export interface IStudent extends Document {
  name: string;
  dob?: Date;
  address?: string;
  residence?: string;
  phone?: string;
  grade: string; // Khối (ví dụ: 1, 2, 3)
  classLetter: string; // Lớp (ví dụ: A, B)
  major: string; // Ngành (ví dụ: CNTT, DS, TĐH)
  schoolYear: string; // Niên khóa
  studentId: string; // Mã học sinh (bắt buộc, backend generate nếu thiếu)
  createdAt?: Date;
  updatedAt?: Date;
}

const StudentSchema: Schema<IStudent> = new Schema(
  {
    name: { type: String, required: true },
    dob: { type: Date },
    address: { type: String },
    residence: { type: String },
    phone: { type: String },
    grade: { type: String, required: true },
    classLetter: { type: String, required: true },
    major: { type: String, required: true },
    schoolYear: { type: String, required: true },
    studentId: { type: String, required: true, unique: true }, // luôn có, unique
  },
  { timestamps: true }
);

const Student = mongoose.model<IStudent>("Student", StudentSchema);

export default Student;
