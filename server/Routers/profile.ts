import mongoose, { Document, Schema } from "mongoose";

export interface IUserDocument extends Document {
  email?: string; // học sinh có thể không có email
  studentId?: string; // thêm studentId
  name?: string;
  dob?: string;
  address?: string;
  residence?: string;
  phone?: string;
  grade?: string;
  classLetter?: string;
  schoolYear?: string;
  password?: string;
  role: "student" | "teacher" | "admin" | "parent";
  teacherId?: mongoose.Types.ObjectId;
  grades?: any[];
  creditsTotal?: number;
  creditsEarned?: number;
  schedule?: any[];
  tuitionTotal?: number;
  tuitionPaid?: number;
  tuitionRemaining?: number;
}

const UserSchema: Schema<IUserDocument> = new Schema({
  email: { type: String, unique: true, sparse: true }, // sparse để không bắt buộc
  studentId: { type: String, unique: true, sparse: true },
  name: String,
  dob: String,
  address: String,
  residence: String,
  phone: String,
  grade: String,
  classLetter: String,
  schoolYear: String,
  password: String,
  role: { type: String, required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: "User" },
  grades: [{ type: Object }],
  creditsTotal: Number,
  creditsEarned: Number,
  schedule: [{ type: Object }],
  tuitionTotal: Number,
  tuitionPaid: Number,
  tuitionRemaining: Number,
});

const User = mongoose.model<IUserDocument>("User", UserSchema);
export default User;
