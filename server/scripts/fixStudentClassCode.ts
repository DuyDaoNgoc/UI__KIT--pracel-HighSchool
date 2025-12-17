import mongoose from "mongoose";
import User from "../models/User";
import { generateClassCode } from "../helpers/classCode";

const mongoUrl =
  process.env.MONGODB_URL || "mongodb://localhost:27017/high_school";

async function fixStudentClassCode() {
  try {
    await mongoose.connect(mongoUrl);
    console.log("✅ Connected to MongoDB");

    // Tìm tất cả học sinh không có classCode
    const studentsWithoutClassCode = await User.find({
      role: "student",
      $or: [
        { classCode: { $exists: false } },
        { classCode: "" },
        { classCode: null },
      ],
    });

    console.log(
      `📊 Found ${studentsWithoutClassCode.length} students without classCode`,
    );

    // Update từng học sinh
    for (const student of studentsWithoutClassCode) {
      if (!student.grade || !student.class || !student.major) {
        console.log(
          `⚠️ Skipping ${student.studentId} - missing grade, class, or major`,
        );
        continue;
      }

      const classCode = generateClassCode(
        student.grade,
        student.class,
        student.major,
      );

      await User.findByIdAndUpdate(student._id, { classCode });

      console.log(
        `✅ Updated ${student.studentId} with classCode: ${classCode}`,
      );
    }

    console.log("✅ Done!");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

fixStudentClassCode();
