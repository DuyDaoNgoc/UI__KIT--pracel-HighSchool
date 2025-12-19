import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITuitionSubject {
  subjectId: Types.ObjectId;
  price: number;
}

export interface ITuition extends Document {
  majorId: Types.ObjectId;
  semester: number; // 1, 2
  subjects: ITuitionSubject[]; // Danh sách môn + giá
  totalAmount: number; // Tổng học phí = tổng giá tất cả môn
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const TuitionSchema = new Schema<ITuition>(
  {
    majorId: {
      type: Schema.Types.ObjectId,
      ref: "Major",
      required: true,
    },
    semester: {
      type: Number,
      enum: [1, 2],
      required: true,
    },
    subjects: [
      {
        subjectId: {
          type: Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        _id: false,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "tuitions" },
);

// Index để tìm kiếm nhanh theo major + semester
TuitionSchema.index({ majorId: 1, semester: 1 });

export default mongoose.model<ITuition>("Tuition", TuitionSchema);
