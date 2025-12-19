const mongoose = require("mongoose");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // Get raw data
    const raw = await db.collection("timetables").findOne({
      classId: new mongoose.Types.ObjectId("6938d84237837ca8740e9804"),
    });

    console.log("📋 RAW TIMETABLE FROM DB:");
    console.log(JSON.stringify(raw, null, 2));

    // Check what fields exist
    console.log("\n🔍 CHECKING FIELDS:");
    if (raw && raw.schedule && raw.schedule[0]) {
      const item = raw.schedule[0];
      console.log("schedule[0]:", JSON.stringify(item, null, 2));
      console.log("teacherId field exists?", "teacherId" in item);
      console.log("teacherId value:", item.teacherId);
      console.log("teacherId type:", typeof item.teacherId);
    }

    await mongoose.connection.close();
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
})();
