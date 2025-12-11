import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
  date: string;
  studentId: string;
  teacherId?: string;
  studentName?: string;
  status: "good" | "warning" | "bad";
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    date: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    teacherId: { type: String, index: true },
    studentName: { type: String },
    status: {
      type: String,
      enum: ["good", "warning", "bad"],
      default: "good",
      required: true,
    },
    notes: { type: String },
  },
  { timestamps: true },
);

// Create index for querying reports by date and optional filters
ReportSchema.index({ date: 1, teacherId: 1 });
ReportSchema.index({ date: 1, studentId: 1 });

export default mongoose.model<IReport>("Report", ReportSchema);
