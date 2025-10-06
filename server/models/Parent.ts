// server/models/Parent.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IParent extends Document {
  name: string;
  email?: string;
  phone?: string;
  childrenIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ParentSchema: Schema<IParent> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    childrenIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model<IParent>("Parent", ParentSchema);
