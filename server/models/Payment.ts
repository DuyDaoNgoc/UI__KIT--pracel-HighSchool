import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPayment extends Document {
  studentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  amount: number;
  status: "paid" | "unpaid";
  date: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["paid", "unpaid"], default: "unpaid" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "payments" },
);

export default mongoose.model<IPayment>("Payment", PaymentSchema);
