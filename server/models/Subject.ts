import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubject extends Document {
  name: string;
  price: number;
  classId: Types.ObjectId;
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
  },
  { timestamps: true, collection: "subjects" },
);

export default mongoose.model<ISubject>("Subject", SubjectSchema);
