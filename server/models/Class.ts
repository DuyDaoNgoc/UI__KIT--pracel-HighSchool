import mongoose, { Schema, Document, Types } from "mongoose";

// Interface Mongoose + TypeScript
export interface IClass extends Document {
  grade: string;
  classLetter: string;
  schoolYear: string;
  major: string;
  classCode: string;
  teacherId?: Types.ObjectId | null;
  teacherName?: string;
  studentIds: Types.ObjectId[];
  className?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    grade: { type: String, required: true, trim: true }, // ✅ bắt buộc
    classLetter: { type: String, required: true, trim: true },
    schoolYear: { type: String, required: true, trim: true },
    major: { type: String, required: true, trim: true },
    classCode: { type: String, required: true, trim: true, unique: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
    teacherName: { type: String, default: "" },

    // ✅ CHỈ SỬA DUY NHẤT 1 ĐIỂM NÀY — ĐỂ THÊM HỌC SINH VÀO LỚP KHÔNG BỊ LỖI
    studentIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [], // ⬅️ **BẮT BUỘC** PHẢI CÓ
    },

    className: { type: String, required: false, trim: true },
  },
  {
    timestamps: true,
    collection: "classes",
  },
);

// Log khi index xong
ClassSchema.on("index", (err) => {
  if (err) console.error("❌ Lỗi tạo index cho Class:", err);
  else console.log("✅ Index ClassSchema sẵn sàng");
});

export default mongoose.model<IClass>("Class", ClassSchema);
