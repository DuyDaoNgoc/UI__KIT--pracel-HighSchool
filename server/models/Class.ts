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
  subjectTeachers?: {
    subjectId: Types.ObjectId;
    subjectName: string;
    teacherId: Types.ObjectId;
    teacherName: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
}
const ClassSchema = new Schema<IClass>(
  {
    grade: { type: String, required: true, trim: true },
    classLetter: { type: String, required: true, trim: true },
    schoolYear: { type: String, required: true, trim: true },
    major: { type: String, required: true, trim: true },
    classCode: { type: String, required: true, trim: true, unique: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
    teacherName: { type: String, default: "" },

    studentIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    className: { type: String, required: false, trim: true },

    // ✅ Thêm đây
    subjectTeachers: {
      type: [
        {
          // reference to global Subject document
          subjectId: {
            type: Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
          },
          subjectName: { type: String, required: true },
          teacherId: {
            type: Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
          },
          teacherName: { type: String, required: true },
        },
      ],
      default: [],
    },
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
