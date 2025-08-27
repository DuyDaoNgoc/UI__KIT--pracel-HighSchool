import { model, Schema } from "mongoose";
import { IUserDocument } from "../types/user";

const UserSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
    dob: { type: Date },
    class: { type: String },
    schoolYear: { type: String },
    phone: { type: String },
    address: { type: String },
    avatar: { type: String, default: "/uploads/default.png" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const UserModel = model<IUserDocument>("User", UserSchema);
export const User = model<IUserDocument>("User", UserSchema);
