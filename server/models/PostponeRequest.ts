import mongoose, { Schema, Document, Types } from "mongoose";

export type PostponeStatus = "pending" | "approved" | "rejected";

export interface IPostponeRequest extends Document {
  itemId?: Types.ObjectId | string;
  timetableId?: Types.ObjectId | string;
  classId?: Types.ObjectId | string;
  teacherId?: Types.ObjectId | string;
  subject?: string;
  reason?: string;
  requestedDate?: string;
  status: PostponeStatus;
  createdBy?: Types.ObjectId | string;
  reviewedBy?: Types.ObjectId | string;
  reviewReason?: string;
}

const PostponeRequestSchema = new Schema<IPostponeRequest>(
  {
    itemId: { type: Schema.Types.Mixed, required: false },
    timetableId: {
      type: Schema.Types.ObjectId,
      ref: "Timetable",
      required: false,
    },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: false },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    subject: { type: String, required: false },
    reason: { type: String, required: false },
    requestedDate: { type: String, required: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
    reviewReason: { type: String, required: false },
  },
  { timestamps: true, collection: "postponeRequests" },
);

export default mongoose.model<IPostponeRequest>(
  "PostponeRequest",
  PostponeRequestSchema,
);
