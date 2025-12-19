// server/scripts/cleanupTimetables.ts
// Cleanup script to remove timetable records without teacherId

import mongoose from "mongoose";
import Timetable from "../models/Timetable";
import dotenv from "dotenv";

dotenv.config();

async function cleanupTimetables() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("✅ Connected to MongoDB");

    // Find timetables with missing teacherId in schedule items
    const problematicTimetables = await Timetable.find({
      "schedule.teacherId": { $exists: false },
    });

    console.log(
      `\n📊 Found ${problematicTimetables.length} timetables with missing teacherId`,
    );

    if (problematicTimetables.length > 0) {
      console.log("\n📋 Timetables to delete:");
      problematicTimetables.forEach((t) => {
        console.log(
          `  - ID: ${t._id}, ClassID: ${t.classId}, Schedule items: ${t.schedule.length}`,
        );
      });

      // Delete them
      const result = await Timetable.deleteMany({
        "schedule.teacherId": { $exists: false },
      });

      console.log(`\n✅ Deleted ${result.deletedCount} timetable(s)`);
    } else {
      console.log("✅ No problematic timetables found - database is clean!");
    }

    // Also show statistics
    const allTimetables = await Timetable.find();
    const withTeacherId = allTimetables.filter((t) =>
      t.schedule.every((s: any) => s.teacherId),
    ).length;

    console.log(`\n📈 Summary:`);
    console.log(`  - Total timetables: ${allTimetables.length}`);
    console.log(`  - With complete teacherId: ${withTeacherId}`);
    console.log(`  - Incomplete: ${allTimetables.length - withTeacherId}`);

    await mongoose.connection.close();
    console.log("\n✅ Cleanup completed and connection closed");
  } catch (err) {
    console.error("❌ Error during cleanup:", err);
    process.exit(1);
  }
}

cleanupTimetables();
