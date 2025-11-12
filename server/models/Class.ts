import mongoose, { Schema, Document, Types } from "mongoose";

export interface IClass extends Document {
  grade: string;
  classLetter: string;
  schoolYear: string;
  major: string;
  classCode: string;
  teacherId?: Types.ObjectId | null;
  teacherName?: string;
  studentIds: Types.ObjectId[];
  className: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    grade: { type: String, required: true, trim: true }, // ✅ required: true
    classLetter: { type: String, required: true, trim: true },
    schoolYear: { type: String, required: true, trim: true },
    major: { type: String, required: true, trim: true },
    classCode: { type: String, required: true, trim: true, unique: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
    teacherName: { type: String, default: "" },
    studentIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    className: {
      type: String,
      required: false, // ✅ Đổi thành false
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "classes",
  },
);

// Index event
ClassSchema.on("index", (err) => {
  if (err) console.error("❌ Lỗi tạo index cho Class:", err);
  else console.log("✅ Index ClassSchema sẵn sàng");
});

export default mongoose.model<IClass>("Class", ClassSchema);
