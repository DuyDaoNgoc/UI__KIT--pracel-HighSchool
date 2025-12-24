import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import User from "../../../../server/models/User";
import TeacherModel from "../../../../server/models/teacherModel";
import StudentModel from "../../../../server/models/Student";

dotenv.config();

async function main() {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    "mongodb://localhost:27017/school";
  const apply = process.argv.includes("--apply");

  console.log(`Connecting to MongoDB: ${mongoUri}`);
  await mongoose.connect(mongoUri, { connectTimeoutMS: 10000 } as any);

  try {
    const users = await User.find().lean();
    console.log(`Found ${users.length} users to inspect`);

    const updates: Array<{ userId: string; before: any; after: any }> = [];

    for (const u of users) {
      const before: any = {
        _id: u._id,
        teacherRef: u.teacherRef || null,
        studentRef: u.studentRef || null,
      };
      const after: any = {};
      let changed = false;

      // Backfill teacherRef if teacherId exists and teacherRef missing
      if ((u as any).teacherId && !(u as any).teacherRef) {
        const teacherIdStr = String((u as any).teacherId);
        let teacher = await TeacherModel.findOne({
          teacherId: teacherIdStr,
        }).lean();
        if (!teacher && u.email) {
          teacher = await TeacherModel.findOne({ email: u.email }).lean();
        }
        if (teacher) {
          after.teacherRef = String(teacher._id);
          changed = true;
          console.log(
            `Will set teacherRef for user ${u._id} -> Teacher ${teacher._id}`,
          );
        }
      }

      // Backfill studentRef if studentId exists and studentRef missing
      if ((u as any).studentId && !(u as any).studentRef) {
        const studentIdStr = String((u as any).studentId);
        let student = await StudentModel.findOne({
          studentId: studentIdStr,
        }).lean();
        if (!student && u.email) {
          student = await StudentModel.findOne({ email: u.email }).lean();
        }
        if (student) {
          after.studentRef = String(student._id);
          changed = true;
          console.log(
            `Will set studentRef for user ${u._id} -> Student ${student._id}`,
          );
        }
      }

      if (changed) updates.push({ userId: String(u._id), before, after });
    }

    const report = {
      timestamp: new Date().toISOString(),
      totalUsers: users.length,
      updatesCount: updates.length,
      updates,
    };

    const reportPath = path.resolve(__dirname, "backfillUserRefs.report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Dry-run report written to ${reportPath}`);
    console.log(`Users to update: ${updates.length}`);

    if (!apply) {
      console.log("Dry-run complete. Rerun with --apply to perform updates.");
      process.exit(0);
    }

    // Backup current users selected for update
    const backupPath = path.resolve(
      __dirname,
      `backfillUserRefs.backup.${Date.now()}.json`,
    );
    fs.writeFileSync(
      backupPath,
      JSON.stringify(
        updates.map((u) => ({ userId: u.userId, before: u.before })),
        null,
        2,
      ),
    );
    console.log(`Backup written to ${backupPath}`);

    // Apply updates
    let applied = 0;
    for (const u of updates) {
      const setObj: any = {};
      if (u.after.teacherRef)
        setObj.teacherRef = mongoose.Types.ObjectId(u.after.teacherRef);
      if (u.after.studentRef)
        setObj.studentRef = mongoose.Types.ObjectId(u.after.studentRef);
      try {
        await User.updateOne({ _id: u.userId }, { $set: setObj });
        applied++;
        console.log(`Updated user ${u.userId}`);
      } catch (e) {
        console.error(`Failed to update user ${u.userId}:`, e);
      }
    }

    console.log(`Applied updates to ${applied} users.`);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
