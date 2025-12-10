import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGrade extends Document {
  studentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  classId: Types.ObjectId;
  score: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const GradeSchema = new Schema<IGrade>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    score: { type: Number, required: true, min: 0, max: 10 },
  },
  { timestamps: true, collection: "grades" },
);

// Index để tìm kiếm nhanh
GradeSchema.index({ studentId: 1, subjectId: 1, classId: 1 }, { unique: true });
GradeSchema.index({ classId: 1, subjectId: 1 });

export default mongoose.model<IGrade>("Grade", GradeSchema);
