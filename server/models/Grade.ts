import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGradeEntry {
  type:
    | "oral" // Kiểm tra miệng
    | "test15" // Kiểm tra 15 phút
    | "test1period" // Kiểm tra 1 tiết
    | "midterm" // Giữa kì
    | "semester1" // Học kì 1
    | "semester2" // Học kì 2
    | "final"; // Cuối kì
  score: number;
  date?: Date;
  note?: string;
}

export interface IGrade extends Document {
  studentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  classId: Types.ObjectId;
  grades: IGradeEntry[]; // Mảng chứa các loại điểm
  averageScore?: number; // Điểm trung bình tự động tính
  createdAt?: Date;
  updatedAt?: Date;
}

const GradeSchema = new Schema<IGrade>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    grades: [
      {
        type: {
          type: String,
          enum: [
            "oral",
            "test15",
            "test1period",
            "midterm",
            "semester1",
            "semester2",
            "final",
          ],
          required: true,
        },
        score: { type: Number, required: true, min: 0, max: 10 },
        date: { type: Date, default: Date.now },
        note: String,
        _id: false,
      },
    ],
    averageScore: { type: Number, min: 0, max: 10 },
  },
  { timestamps: true, collection: "grades" },
);

// Index để tìm kiếm nhanh
GradeSchema.index({
  studentId: 1,
  subjectId: 1,
  classId: 1,
});
GradeSchema.index({ classId: 1, subjectId: 1 });

export default mongoose.model<IGrade>("Grade", GradeSchema);
