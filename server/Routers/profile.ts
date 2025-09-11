import mongoose, { Document, Schema } from "mongoose";

export interface IUserDocument extends Document {
  email: string;
  role: "student" | "teacher" | "admin" | "parent";
  grades?: any[];
  creditsTotal?: number;
  creditsEarned?: number;
  schedule?: any[];
  tuitionTotal?: number;
  tuitionPaid?: number;
  tuitionRemaining?: number;
}

const UserSchema: Schema<IUserDocument> = new Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  grades: [{ type: Object }],
  creditsTotal: Number,
  creditsEarned: Number,
  schedule: [{ type: Object }],
  tuitionTotal: Number,
  tuitionPaid: Number,
  tuitionRemaining: Number,
});

const User = mongoose.model<IUserDocument>("User", UserSchema);
export default User; // ✅ default export
