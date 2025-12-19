const mongoose = require("mongoose");
require("dotenv").config();

const mongoUrl = process.env.MONGO_URI;

async function findAll() {
  try {
    await mongoose.connect(mongoUrl);
    const db = mongoose.connection.db;
    const collection = db.collection("timetables");

    const docs = await collection.find({}).toArray();
    console.log(`\n📋 TOTAL TIMETABLES FOUND: ${docs.length}\n`);

    docs.forEach((doc, idx) => {
      console.log(`[${idx}] ID: ${doc._id}`);
      console.log(`    classId: ${doc.classId}`);
      console.log(`    schedule items: ${doc.schedule?.length || 0}`);
      doc.schedule?.forEach((item, i) => {
        console.log(`      [${i}] teacherId=${item.teacherId}`);
      });
      console.log();
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

findAll();
