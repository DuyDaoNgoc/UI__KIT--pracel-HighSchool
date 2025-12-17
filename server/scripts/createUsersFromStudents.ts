import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Student from "../models/Student";
import User from "../models/User";

const mongoUrl =
  process.env.MONGODB_URL || "mongodb://localhost:27017/high_school";

async function createUsers() {
  try {
    await mongoose.connect(mongoUrl);
    console.log("✅ Connected to MongoDB", mongoUrl);

    const students = await Student.find({}).lean();
    console.log(`🔍 Found ${students.length} students in students collection`);

    let created = 0;
    let skipped = 0;

    for (const s of students) {
      if (!s.studentId) {
        console.warn("⚠️ Skipping student without studentId", s._id);
        skipped++;
        continue;
      }

      const existing = await User.findOne({
        $or: [{ studentId: s.studentId }, { email: s.email }],
      }).lean();
      if (existing) {
        console.log(
          `ℹ️ User already exists for ${s.studentId} (${s.email || "no-email"})`,
        );
        skipped++;
        continue;
      }

      const rawPassword = String(s.studentId);
      const hashed = await bcrypt.hash(rawPassword, 10);

      const userDoc = await User.create({
        username: s.name || s.studentId,
        email: s.email || "",
        password: hashed,
        role: "student",
        studentId: s.studentId,
        createdAt: new Date(),
      } as any);

      console.log(
        `✅ Created user for ${s.studentId} (id=${(userDoc as any)._id})`,
      );
      created++;
    }

    console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  } catch (err) {
    console.error("❌ Error creating users:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createUsers();
