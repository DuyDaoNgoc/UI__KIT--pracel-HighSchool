import mongoose, { Schema, Document, Types } from "mongoose";

export interface IStudentTuition extends Document {
  tuitionId: Types.ObjectId; // Reference to Tuition table
  studentId: Types.ObjectId; // Reference to Student
  schoolYear?: string; // e.g., "2024-2025"
  semester?: number; // 1, 2
  totalAmount: number; // Total tuition amount
  paidAmount: number; // Amount already paid
  remainingAmount: number; // Amount still owed
  status: "unpaid" | "partial" | "paid"; // Payment status
  notes?: string; // Admin notes
  lastUpdatedBy?: Types.ObjectId; // Admin who last updated
  updatedAt?: Date;
  createdAt?: Date;
}

const StudentTuitionSchema = new Schema<IStudentTuition>(
  {
    tuitionId: {
      type: Schema.Types.ObjectId,
      ref: "Tuition",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    schoolYear: {
      type: String,
    },
    semester: {
      type: Number,
      enum: [1, 2],
    },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    notes: {
      type: String,
      default: "",
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, collection: "student_tuitions" },
);

// Index for quick lookups
StudentTuitionSchema.index({ tuitionId: 1, studentId: 1 }, { unique: true });
StudentTuitionSchema.index({ studentId: 1 });
StudentTuitionSchema.index({ tuitionId: 1 });
StudentTuitionSchema.index({ schoolYear: 1, semester: 1 });
StudentTuitionSchema.index({ status: 1 });

export default mongoose.model<IStudentTuition>(
  "StudentTuition",
  StudentTuitionSchema,
);
