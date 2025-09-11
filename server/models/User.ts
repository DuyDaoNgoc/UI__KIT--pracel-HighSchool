import { Schema, model } from "mongoose";
import { IUserDocument } from "../types/user";

// Schema Mongoose cho User
const UserSchema = new Schema<IUserDocument>(
  {
    customId: { type: String },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "teacher", "admin", "parent"],
      default: "student",
      required: true,
    },
    dob: { type: Date },
    class: { type: String },
    schoolYear: { type: String },
    phone: { type: String },
    address: { type: String },
    avatar: { type: String },
    createdAt: { type: Date, default: Date.now },
    children: [{ type: Schema.Types.ObjectId, ref: "User" }],
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: false }, // ObjectId liên kết giáo viên
    grades: [
      {
        subject: { type: String },
        score: { type: Number },
      },
    ],
    creditsTotal: { type: Number },
    creditsEarned: { type: Number },
    schedule: [
      {
        day: { type: String },
        subject: { type: String },
        startTime: { type: String },
        endTime: { type: String },
      },
    ],
    tuitionTotal: { type: Number },
    tuitionPaid: { type: Number },
    tuitionRemaining: { type: Number },
  },
  {
    timestamps: true, // tự thêm createdAt & updatedAt nếu muốn
  }
);

export const User = model<IUserDocument>("User", UserSchema);
export default User;
