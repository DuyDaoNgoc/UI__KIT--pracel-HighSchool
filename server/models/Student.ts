import mongoose, { Document, Schema, Types, CallbackError } from "mongoose";
import ClassModel from "./Class"; // import model Class

export interface IStudent extends Document {
  name: string;
  dob?: Date;
  address?: string;
  residence?: string;
  phone?: string;
  grade: string;
  classLetter: string;
  major: string;
  schoolYear: string;
  studentId: string;
  classCode?: string;
  className: string;
  teacherId?: Types.ObjectId | null;
  parentId?: Types.ObjectId | null;
  avatar?: string;
  role?: string;
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
    studentId: { type: String, required: true, unique: true },
    classCode: { type: String },
    className: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
    parentId: { type: Schema.Types.ObjectId, ref: "Parent", default: null },
    avatar: { type: String, default: "" },
    role: { type: String, default: "student" },
  },
  { timestamps: true },
);

StudentSchema.pre<IStudent>("save", async function (next) {
  try {
    // 🔹 Sinh studentId nếu chưa có
    if (!this.studentId) {
      const StudentModel = mongoose.model<IStudent>("Student");
      const lastStudent = await StudentModel.findOne(
        {},
        {},
        { sort: { studentId: -1 } },
      );
      let newId = "HS00001";
      if (lastStudent?.studentId) {
        const num = parseInt(lastStudent.studentId.replace("HS", ""), 10) + 1;
        newId = "HS" + num.toString().padStart(5, "0");
      }
      this.studentId = newId;
    }

    // 🔹 Tự sinh className nếu chưa có
    if (!this.className) {
      this.className = `${this.grade}${this.classLetter} - ${this.major}`;
    }

    // 🔹 Sinh classCode để xác định lớp
    this.classCode = `${this.grade}${this.classLetter}${this.major
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("")}`;

    // 🔹 Thêm học sinh vào lớp đúng classCode
    const cls = await ClassModel.findOne({ classCode: this.classCode });

    if (cls) {
      const studentObjectId = this._id;

      const exists = cls.studentIds.some((id) => id.equals(studentObjectId));
      if (!exists) {
        cls.studentIds.push(studentObjectId);
        await cls.save();
      }
    }

    next();
  } catch (err: unknown) {
    console.error("⚠️ StudentSchema pre-save error:", err);
    next(err as CallbackError);
  }
});

const Student = mongoose.model<IStudent>("Student", StudentSchema);
export default Student;
