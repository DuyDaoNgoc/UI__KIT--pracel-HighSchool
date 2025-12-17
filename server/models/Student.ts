import mongoose, { Document, Schema, CallbackError } from "mongoose";
import ClassModel from "./Class"; // import model Class

export interface IStudent extends Document {
  name: string;
  username?: string;
  dob?: Date;
  address?: string;
  residence?: string;
  phone?: string;
  email?: string;
  gender?: string;
  grade: string;
  classLetter: string;
  major: string;
  schoolYear: string;
  studentId: string;
  classCode?: string;
  className: string;
  teacherId?: string;
  parentId?: string;
  avatar?: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const StudentSchema: Schema<IStudent> = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String },
    dob: { type: Date },
    address: { type: String },
    residence: { type: String },
    phone: { type: String },
    email: { type: String },
    gender: { type: String, default: "" },
    grade: { type: String, required: true },
    classLetter: { type: String, required: true },
    major: { type: String, required: true },
    schoolYear: { type: String, required: true },
    studentId: { type: String, required: true, unique: true },
    classCode: { type: String },
    className: { type: String, required: true },
    teacherId: { type: String, default: "" },
    parentId: { type: String, default: "" },
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
      const studentObjectId = this._id as mongoose.Types.ObjectId;

      const exists = cls.studentIds.some((id: mongoose.Types.ObjectId) =>
        (id as mongoose.Types.ObjectId).equals(studentObjectId),
      );
      if (!exists) {
        cls.studentIds.push(studentObjectId as any);
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
