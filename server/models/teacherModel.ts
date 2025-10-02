import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAssignedClass {
  grade: string;
  classLetter: string;
  major: string;
  schoolYear: string;
  classCode: string;
}

export interface ITeacher extends Document {
  teacherId: string;
  name: string;
  dob?: Date;
  gender: "male" | "female" | "other";
  phone?: string;
  address?: string;
  majors: string[];
  subjectClasses: string[];
  assignedClass?: IAssignedClass;
  assignedClassCode?: string; // optional
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

// AssignedClass Schema
const AssignedClassSchema = new Schema<IAssignedClass>({
  grade: { type: String, required: true },
  classLetter: { type: String, required: true },
  major: { type: String, required: true },
  schoolYear: { type: String, required: true },
  classCode: { type: String, required: true },
});

// Teacher Schema
const TeacherSchema = new Schema<ITeacher>(
  {
    teacherId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    phone: { type: String },
    address: { type: String },
    majors: { type: [String], default: [] },
    subjectClasses: { type: [String], default: [] },
    assignedClass: { type: AssignedClassSchema, default: undefined },
    assignedClassCode: { type: String, unique: true, sparse: true }, // optional
    email: { type: String, unique: true, sparse: true },
    degree: { type: String },
    educationLevel: { type: String },
    certificates: { type: [String], default: [] },
    research: { type: String },
    subject: { type: [String], default: [] },
    avatar: { type: String },
  },
  { timestamps: true }
);

// Index unique on assignedClass.classCode only if defined
TeacherSchema.index(
  { "assignedClass.classCode": 1 },
  { unique: true, sparse: true }
);

// Middleware: auto generate teacherId if not provided
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

  // Loại bỏ assignedClass nếu classCode trống
  if (this.assignedClass?.classCode?.trim() === "") {
    this.assignedClass = undefined;
    this.assignedClassCode = undefined;
  }

  next();
});

// Model
const TeacherModel: Model<ITeacher> = mongoose.model<ITeacher>(
  "Teacher",
  TeacherSchema
);

export default TeacherModel;
