import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITimetable extends Document {
  classId: Types.ObjectId;
  schedule: {
    day: string;
    subjectId: Types.ObjectId;
    startTime: string;
    endTime: string;
  }[];
}

const TimetableSchema = new Schema<ITimetable>(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    schedule: [
      {
        day: { type: String, required: true },
        subjectId: {
          type: Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
  },
  { timestamps: true, collection: "timetables" },
);

export default mongoose.model<ITimetable>("Timetable", TimetableSchema);
