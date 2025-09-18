import mongoose, { Schema, Document, Types } from "mongoose";

// Interface
export interface IClass extends Document {
  grade: string; // vd: 10, 11, 12
  classLetter: string; // vd: A, B, C
  schoolYear: { type: String; required: true }; // 🎯 thêm field này
  major: string; // ghi tắt ngành, vd: CNTT, CĐT, QTKD
  classCode: string; // mã lớp, vd: 10A1CNTT
  // Thông tin giáo viên chủ nhiệm
  teacherName?: string; // Tên giáo viên
  teacherId?: string; // ID giáo viên, đồng bộ với User.teacherId
  studentIds: Types.ObjectId[];
  createdAt: Date; // ngày tạo
  updatedAt: Date; // ngày cập nhật
}

// Schema
const ClassSchema = new Schema<IClass>(
  {
    grade: { type: String, required: true }, // vd: 10, 11, 12
    classLetter: { type: String, required: true }, // vd: A, B, C

    major: { type: String, required: true }, // ghi tắt ngành, vd: CNTT, CĐT, QTKD
    classCode: { type: String, required: true, unique: true }, // mã lớp, vd: 10A1CNTT (đảm bảo unique)
    // Thông tin giáo viên chủ nhiệm
    teacherName: { type: String, default: null }, // Tên giáo viên
    teacherId: { type: String, default: null }, // để đồng bộ với User.teacherId
    studentIds: [{ type: Schema.Types.ObjectId, ref: "User" }], // danh sách ID học sinh
  },
  { timestamps: true }
);

// Index cho classCode + major để đảm bảo uniqueness
ClassSchema.index({ classCode: 1, major: 1 }, { unique: true }); // đảm bảo không trùng lặp

// Model
// eslint-disable-next-line import/no-mutable-exports
export default mongoose.model<IClass>("Class", ClassSchema);
