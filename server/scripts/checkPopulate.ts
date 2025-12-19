import mongoose from "mongoose";
import Timetable from "../models/Timetable";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "");

    const timetable = await Timetable.findOne({
      classId: new mongoose.Types.ObjectId("6938d84237837ca8740e9804"),
    }).populate("schedule.teacherId");

    console.log("📦 AFTER POPULATE:");
    if (timetable?.schedule?.[0]) {
      const item = timetable.schedule[0];
      console.log("teacherId:", item.teacherId);
      console.log("teacherId._id:", (item.teacherId as any)?._id);
      console.log("teacherId type:", typeof item.teacherId);
    }

    // As JSON (what axios receives)
    console.log("\n📤 AS JSON (what axios gets):");
    const json = JSON.parse(JSON.stringify({ data: timetable }));
    console.log("teacherId in JSON:", json.data?.schedule?.[0]?.teacherId);

    await mongoose.connection.close();
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
})();
