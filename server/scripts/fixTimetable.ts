// server/scripts/fixTimetable.ts
import mongoose from "mongoose";
import Timetable from "../models/Timetable";
import dotenv from "dotenv";

dotenv.config();

async function fixTimetable() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("✅ Connected to MongoDB");

    // Delete timetables with wrong teacher
    const wrongTeacherId = "693a890ea2bc5f534a89e4ad";
    const deleteResult = await Timetable.deleteMany({
      "schedule.teacherId": wrongTeacherId,
    });
    console.log(
      `\n🗑️  Deleted ${deleteResult.deletedCount} timetable(s) with wrong teacher`,
    );

    // Create correct timetable
    const correctTeacherId = new mongoose.Types.ObjectId(
      "693a890fa2bc5f534a89e4b0",
    );
    const classId = new mongoose.Types.ObjectId("6938d84237837ca8740e9804");
    const subjectId = new mongoose.Types.ObjectId("693a618d041d8a84cc05556e");

    const newTimetable = new Timetable({
      classId,
      schedule: [
        {
          day: "Thứ Hai",
          subjectId,
          teacherId: correctTeacherId,
          startTime: "07:00",
          endTime: "11:00",
        },
      ],
    });

    await newTimetable.save();
    console.log(
      `\n✅ Created new timetable with correct teacher:\n`,
      JSON.stringify(
        {
          _id: newTimetable._id,
          classId: newTimetable.classId,
          schedule: newTimetable.schedule.map((s: any) => ({
            day: s.day,
            subjectId: String(s.subjectId),
            teacherId: String(s.teacherId),
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        },
        null,
        2,
      ),
    );

    // Verify
    const verify = await Timetable.findById(newTimetable._id).populate(
      "schedule.teacherId",
    );
    console.log(`\n📊 Verification - Populated teacherId:`, {
      teacherId: ((verify?.schedule as any)?.[0]?.teacherId as any)?._id,
      teacherName: ((verify?.schedule as any)?.[0]?.teacherId as any)?.name,
    });

    await mongoose.connection.close();
    console.log("\n✅ Done!");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

fixTimetable();
