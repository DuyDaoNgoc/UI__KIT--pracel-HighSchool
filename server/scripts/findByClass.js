const mongoose = require("mongoose");
require("dotenv").config();

const mongoUrl = process.env.MONGO_URI;

async function findByClass() {
  try {
    await mongoose.connect(mongoUrl);
    const db = mongoose.connection.db;
    const collection = db.collection("timetables");

    const classId = "6938d84237837ca8740e9804";
    console.log(`\n🔍 Finding timetables for classId: ${classId}\n`);

    const docs = await collection.find({ classId }).toArray();
    console.log(`📋 FOUND: ${docs.length} timetable(s)\n`);

    docs.forEach((doc, idx) => {
      console.log(`[${idx}] ID: ${doc._id}`);
      console.log(`    classId: ${doc.classId}`);
      console.log(`    JSON: ${JSON.stringify(doc, null, 2)}`);
      console.log();
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

findByClass();
