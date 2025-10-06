import mongoose, { Document, Schema } from "mongoose";

// Interface Mongoose + TS
export interface IStudent extends Document {
  name: string;
  dob?: Date;
  address?: string;
  residence?: string;
  phone?: string;
  grade: string; // Khối
  classLetter: string; // Lớp
  major: string; // Ngành
  schoolYear: string; // Niên khóa
  studentId: string; // Mã học sinh
  classCode?: string; // 💡 thêm để truy cập classCode
  className: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Schema
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
    studentId: { type: String, required: true, unique: true },
    classCode: { type: String }, // 💡 thêm field
  },
  { timestamps: true }
);

// 📌 Middleware: tự sinh studentId nếu chưa có
StudentSchema.pre<IStudent>("save", async function (next) {
  if (!this.studentId) {
    const lastStudent = await Student.findOne(
      {},
      {},
      { sort: { studentId: -1 } }
    );

    let newId = "HS00001"; // default
    if (lastStudent?.studentId) {
      const num = parseInt(lastStudent.studentId.replace("HS", ""), 10) + 1;
      newId = "HS" + num.toString().padStart(5, "0");
    }

    this.studentId = newId;
  }
  next();
});

// Model
const Student = mongoose.model<IStudent>("Student", StudentSchema);

export default Student;
