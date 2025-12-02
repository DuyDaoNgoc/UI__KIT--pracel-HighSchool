// src/models/teacherModel.ts

import mongoose, { Schema, Document, Model } from "mongoose";

/* =======================
   INTERFACE: IAssignedClass
   =======================
   - Mô tả sub-document "assignedClass" (lớp mà giáo viên được gán).
   - Việc khai báo interface giúp TypeScript kiểm tra khi gán/đọc assignedClass.
*/
export interface IAssignedClass {
  grade: string; // Khối lớp (VD: "10", "11")
  classLetter: string; // Tên lớp (VD: "A", "B")
  major: string; // Chuyên ngành (VD: "Toán")
  schoolYear: string; // Niên khóa (VD: "2024-2025")
  classCode: string; // Mã duy nhất của lớp (VD: "10A1-2024") => dùng để lookup
  className?: string; // Tên hiển thị (VD: "10A - Toán (2024-2025)")
}

/* =======================
   INTERFACE: ITeacher
   =======================
   - Mô tả document Teacher trong MongoDB.
   - assignedClass: mảng các lớp được gán (thay vì 1 object).
*/
export interface ITeacher extends Document {
  teacherId: string;
  name: string;
  dob?: Date;
  gender: "Nam" | "Nữ" | "other";
  phone?: string;
  address?: string;
  majors: string[];
  subjectClasses: string[];
  assignedClass: IAssignedClass[]; // CHÚ Ý: chuyển sang mảng
  assignedClassCode?: string;
  email?: string;
  degree?: string;
  educationLevel?: string;
  certificates: string[];
  research?: string;
  subject: string[];
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/* =======================
   SCHEMA: AssignedClassSchema
   =======================
*/
const AssignedClassSchema = new Schema<IAssignedClass>({
  grade: { type: String, required: true },
  classLetter: { type: String, required: true },
  major: { type: String, required: true },
  schoolYear: { type: String, required: true },
  classCode: { type: String, required: true },
  className: { type: String },
});

/* =======================
   SCHEMA: TeacherSchema
   =======================
*/
const TeacherSchema = new Schema<ITeacher>(
  {
    teacherId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    dob: { type: Date },
    gender: { type: String, enum: ["Nam", "Nữ", "other"], required: true },
    phone: { type: String },
    address: { type: String },
    majors: { type: [String], default: [] },
    subjectClasses: { type: [String], default: [] },

    // assignedClass: MẢNG các lớp được gán
    assignedClass: { type: [AssignedClassSchema], default: [] },

    assignedClassCode: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    degree: { type: String },
    educationLevel: { type: String },
    certificates: { type: [String], default: [] },
    research: { type: String },
    subject: { type: [String], default: [] },
    avatar: { type: String },
  },
  { timestamps: true },
);

/* =======================
   INDEX: unique có điều kiện cho assignedClass.classCode
   =======================
*/
TeacherSchema.index(
  { "assignedClass.classCode": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "assignedClass.classCode": { $exists: true, $ne: null },
    },
  },
);

/* =======================
   PRE-save MIDDLEWARE
   =======================
*/
TeacherSchema.pre<ITeacher>("save", async function (next) {
  if (!this.teacherId) {
    const TeacherModel = mongoose.model<ITeacher>("Teacher");
    const lastTeacher = await TeacherModel.findOne({}, { teacherId: 1 })
      .sort({ teacherId: -1 })
      .lean();

    const lastNumber = lastTeacher?.teacherId
      ? parseInt(lastTeacher.teacherId.replace("GV", ""), 10)
      : 0;

    this.teacherId = "GV" + (lastNumber + 1).toString().padStart(5, "0");
  }

  // Xóa sub-doc rỗng trong mảng assignedClass nếu classCode rỗng
  this.assignedClass = this.assignedClass.filter(
    (cls) => cls.classCode?.trim() !== "",
  );

  next();
});

/* =======================
   MODEL: TeacherModel
   =======================
*/
const TeacherModel: Model<ITeacher> = mongoose.model<ITeacher>(
  "Teacher",
  TeacherSchema,
);

export default TeacherModel;
