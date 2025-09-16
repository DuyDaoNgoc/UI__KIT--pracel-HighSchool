// server/models/News.ts
import mongoose, { Schema, Document } from "mongoose";

export interface INews extends Document {
  title: string; // tiêu đề tin tức
  content: string; // nội dung tin tức
  author: mongoose.Types.ObjectId; // tham chiếu đến User (tác giả)
  status: "pending" | "approved" | "rejected"; // trạng thái duyệt
  createdAt: Date; // ngày tạo
}

const NewsSchema: Schema = new Schema(
  {
    title: { type: String, required: true }, // tiêu đề tin tức
    content: { type: String, required: true }, // nội dung tin tức
    author: { type: Schema.Types.ObjectId, ref: "User", required: true }, // tham chiếu đến User (tác giả)
    // Trạng thái duyệt
    status: {
      type: String, // kiểu chuỗi
      enum: ["pending", "approved", "rejected"], // chỉ cho phép 3 giá trị này
      default: "pending", // mặc định là "pending"
    },
  },
  { timestamps: true }
);

export const News = mongoose.model<INews>("News", NewsSchema);
