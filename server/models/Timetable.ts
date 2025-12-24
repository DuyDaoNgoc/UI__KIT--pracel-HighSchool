import mongoose, { Schema, Document, Types } from "mongoose";
import { ITeacher } from "../types/teacher";
export interface ITimetable extends Document {
  classId: Types.ObjectId;
  schedule: {
    day: string;
    subjectId: Types.ObjectId;
    teacherId: Types.ObjectId;
    startTime: string;
    endTime: string;
    week?: string;
    periodFrom?: string;
    canceledDates?: string[];
  }[];
}

const TimetableSchema = new Schema<ITimetable>(
  {
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    schedule: [
      {
        day: { type: String, required: true },
        week: { type: String, required: false },
        subjectId: {
          type: Schema.Types.ObjectId,
          ref: "Subject",
          required: false,
        },
        // teacher assigned for this schedule item - optional
        teacherId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: false,
        },
        // optional periodFrom (date string), canceledDates etc.
        periodFrom: { type: String, required: false },
        canceledDates: { type: [String], required: false },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
  },
  { timestamps: true, collection: "timetables" },
);

export default mongoose.model<ITimetable>("Timetable", TimetableSchema);
