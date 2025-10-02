import mongoose, { Schema, Document } from "mongoose";

export interface IMajor extends Document {
  name: string;
  code: string;
}

const MajorSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
});

export default mongoose.model<IMajor>("Major", MajorSchema);
