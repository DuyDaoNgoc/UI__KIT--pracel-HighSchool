const mongoose = require("mongoose");
require("dotenv").config();

const mongoUrl = process.env.MONGO_URI;

async function checkTypes() {
  try {
    await mongoose.connect(mongoUrl);
    const db = mongoose.connection.db;
    const collection = db.collection("timetables");

    const doc = await collection.findOne({});
    console.log(`\n📋 FIRST TIMETABLE:\n`);
    console.log(`_id: ${doc._id} (type: ${typeof doc._id})`);
    console.log(`classId: ${doc.classId} (type: ${typeof doc.classId})`);
    console.log(`classId constructor: ${doc.classId.constructor.name}`);

    const classId = "6938d84237837ca8740e9804";
    console.log(`\nSearching for classId as string: ${classId}`);
    const result1 = await collection.findOne({ classId });
    console.log(`Result: ${result1 ? "FOUND" : "NOT FOUND"}`);

    const ObjectId = mongoose.Types.ObjectId;
    const classIdObj = new ObjectId(classId);
    console.log(`\nSearching for classId as ObjectId: ${classIdObj}`);
    const result2 = await collection.findOne({ classId: classIdObj });
    console.log(`Result: ${result2 ? "FOUND" : "NOT FOUND"}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkTypes();
