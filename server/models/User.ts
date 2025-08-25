import { Schema, model } from "mongoose";
import { IUserDocument } from "../types/user";

const userSchema = new Schema<IUserDocument>({
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
  createdAt: { type: Date, default: Date.now },
});

export const User = model<IUserDocument>("User", userSchema);
