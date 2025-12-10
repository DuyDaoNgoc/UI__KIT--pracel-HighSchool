import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGradeLock extends Document {
  subjectId: Types.ObjectId;
  classId: Types.ObjectId;
  isLocked: boolean;
  lockedAt?: Date;
  lockedBy?: string; // admin id
  createdAt?: Date;
  updatedAt?: Date;
}

const GradeLockSchema = new Schema<IGradeLock>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    isLocked: { type: Boolean, default: false },
    lockedAt: { type: Date },
    lockedBy: { type: String },
  },
  { timestamps: true, collection: "gradelocks" },
);

export default mongoose.model<IGradeLock>("GradeLock", GradeLockSchema);
