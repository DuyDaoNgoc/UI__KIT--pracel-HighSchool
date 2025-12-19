const mongoose = require("mongoose");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const timetables = await db.collection("timetables").find({}).toArray();
    console.log("📊 ALL TIMETABLES IN DB:");
    timetables.forEach((t, i) => {
      console.log(`\n[${i}] ID: ${t._id}`);
      console.log("ClassID:", t.classId);
      console.log("Schedule items:", t.schedule.length);
      t.schedule.forEach((s, j) => {
        console.log(
          `  Item ${j}: day='${s.day}', subjectId='${s.subjectId}', teacherId='${s.teacherId}'`,
        );
      });
    });
    await mongoose.connection.close();
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
})();
