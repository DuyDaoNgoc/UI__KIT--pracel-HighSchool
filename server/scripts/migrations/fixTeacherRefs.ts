import { ObjectId } from "mongodb";

async function main() {
  const rawArgs = process.argv.slice(2);
  const apply = rawArgs.includes("--apply");

  const mongoFlag = rawArgs.indexOf("--mongo");
  if (mongoFlag !== -1 && rawArgs[mongoFlag + 1])
    process.env.MONGO_URI = rawArgs[mongoFlag + 1];
  const dbFlag = rawArgs.indexOf("--db");
  if (dbFlag !== -1 && rawArgs[dbFlag + 1])
    process.env.MONGO_DB_NAME = rawArgs[dbFlag + 1];

  const { connectDB } = await import("../../configs/db");
  const db = await connectDB();

  const classesCol = db.collection("classes");
  const teachersCol = db.collection("teachers");
  const usersCol = db.collection("users");

  const cursor = classesCol.find({});
  const report: any = {
    scanned: 0,
    updates: [],
    skipped: 0,
    timestamp: new Date().toISOString(),
    apply,
  };
  const backupDir = "server/scripts/migrations/backups";
  const fs = require("fs");
  if (apply && !fs.existsSync(backupDir))
    fs.mkdirSync(backupDir, { recursive: true });

  while (await cursor.hasNext()) {
    const cls = await cursor.next();
    if (!cls) continue;
    report.scanned++;
    const before = cls;
    const updates: any = { classId: cls._id, set: {}, changed: false };

    // Helper to resolve a teacherRef value -> userId (ObjectId) or null
    const resolveToUserId = async (val: any): Promise<any> => {
      if (!val) return null;
      // If val already looks like a user ObjectId string
      try {
        if (typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val)) {
          const maybeUser = await usersCol.findOne({ _id: new ObjectId(val) });
          if (maybeUser) return new ObjectId(val);
        }
      } catch (e) {
        // ignore
      }

      // If val is an object with _id
      if (val && typeof val === "object" && val._id) {
        try {
          const idStr = String(val._id);
          if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
            // First check if there's a user with teacherRef == this id
            const u1 = await usersCol.findOne({
              teacherRef: new ObjectId(idStr),
            });
            if (u1) return u1._id;
            // Or a teacher doc with that id
            const tdoc = await teachersCol.findOne({
              _id: new ObjectId(idStr),
            });
            if (tdoc) {
              // find user by teacherId or teacherRef
              const u2 = await usersCol.findOne({
                $or: [{ teacherId: tdoc.teacherId }, { teacherRef: tdoc._id }],
              });
              if (u2) return u2._id;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // If it's a teacher code like GV00001
      if (typeof val === "string" && /^GV/.test(val)) {
        const u = await usersCol.findOne({ teacherId: val });
        if (u) return u._id;
        const tdoc = await teachersCol.findOne({ teacherId: val });
        if (tdoc) {
          const u2 = await usersCol.findOne({
            $or: [{ teacherRef: tdoc._id }, { teacherId: tdoc.teacherId }],
          });
          if (u2) return u2._id;
        }
      }

      // last attempt: if val is string and matches teacher _id
      if (typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val)) {
        const tdoc = await teachersCol.findOne({ _id: new ObjectId(val) });
        if (tdoc) {
          const u2 = await usersCol.findOne({
            $or: [{ teacherRef: tdoc._id }, { teacherId: tdoc.teacherId }],
          });
          if (u2) return u2._id;
        }
      }

      return null;
    };

    // Top-level teacherId
    const topTid = cls.teacherId;
    const newTop = await resolveToUserId(topTid);
    if (newTop && String(newTop) !== String(topTid)) {
      updates.set.teacherId = newTop;
      updates.changed = true;
    }

    // Subject teachers
    if (Array.isArray(cls.subjectTeachers) && cls.subjectTeachers.length > 0) {
      const newSubjectTeachers = [];
      let subjChanged = false;
      for (const st of cls.subjectTeachers) {
        const cur = { ...st };
        const curTid = st.teacherId;
        const newTid = await resolveToUserId(curTid);
        if (newTid && String(newTid) !== String(curTid)) {
          cur.teacherId = newTid;
          subjChanged = true;
        }
        newSubjectTeachers.push(cur);
      }
      if (subjChanged) {
        updates.set.subjectTeachers = newSubjectTeachers;
        updates.changed = true;
      }
    }

    if (!updates.changed) {
      report.skipped++;
      continue;
    }

    // Record planned update
    report.updates.push({
      classId: cls._id,
      before: before,
      afterSet: updates.set,
    });

    if (apply) {
      // backup original
      const bpath = `${backupDir}/${String(cls._id)}.before.json`;
      fs.writeFileSync(bpath, JSON.stringify(before, null, 2));

      // perform update: set teacherId and/or subjectTeachers
      const setObj: any = {};
      if (updates.set.teacherId) setObj.teacherId = updates.set.teacherId;
      if (updates.set.subjectTeachers)
        setObj.subjectTeachers = updates.set.subjectTeachers;

      await classesCol.updateOne({ _id: cls._id }, { $set: setObj });
      report.applied = (report.applied || 0) + 1;
    }
  }

  const outPath = "server/scripts/migrations/fixTeacherRefs.report.json";
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(
    `Done. scanned=${report.scanned}, plannedUpdates=${report.updates.length}, skipped=${report.skipped}, applied=${report.applied || 0}`,
  );
  console.log(`Report written to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import ClassModel from "../../../../server/models/Class";
import User from "../../../../server/models/User";
import TeacherModel from "../../../../server/models/teacherModel";

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
    const classes = await ClassModel.find().lean();
    console.log(`Found ${classes.length} classes to inspect`);

    let classesToUpdate: Array<{
      classId: string;
      classCode?: string;
      updates: any;
      before?: any;
    }> = [];
    let subjectTeacherUpdates = 0;
    let teacherIdUpdates = 0;

    for (const cls of classes) {
      const updates: any = {};
      let hasChange = false;

      // Normalize teacherId at class level
      const currentTid = (cls as any).teacherId;
      if (currentTid) {
        // If stored as ObjectId-like string or ObjectId, check if it matches a User._id
        const currentTidStr = String(currentTid);

        // 1) if matches a user by _id -> assume OK
        let user = await User.findById(currentTidStr).lean();

        // 2) otherwise try matching by teacherId (teacher code)
        if (!user) {
          user = await User.findOne({ teacherId: currentTidStr }).lean();
        }

        if (user && String(user._id) !== currentTidStr) {
          // We should update class.teacherId to the user's ObjectId
          updates.teacherId = mongoose.Types.ObjectId(String(user._id));
          hasChange = true;
          teacherIdUpdates++;
          console.log(
            `Will update class ${cls.classCode} teacherId: ${currentTidStr} -> ${user._id}`,
          );
        }
      }

      // Normalize each subjectTeachers[].teacherId
      if (
        Array.isArray((cls as any).subjectTeachers) &&
        (cls as any).subjectTeachers.length > 0
      ) {
        const newSubjectTeachers = [] as any[];
        let anySubjectChanged = false;
        for (const st of (cls as any).subjectTeachers) {
          const stCopy = { ...st };
          const stTid = st.teacherId;
          if (stTid) {
            const stTidStr = String(stTid);
            let user = await User.findById(stTidStr).lean();
            if (!user) {
              user = await User.findOne({ teacherId: stTidStr }).lean();
            }
            if (user && String(user._id) !== stTidStr) {
              stCopy.teacherId = mongoose.Types.ObjectId(String(user._id));
              anySubjectChanged = true;
              subjectTeacherUpdates++;
              console.log(
                `Will update class ${cls.classCode} subject ${st.subjectName || st.subjectId} teacherId: ${stTidStr} -> ${user._id}`,
              );
            }
          }
          newSubjectTeachers.push(stCopy);
        }
        if (anySubjectChanged) {
          updates.subjectTeachers = newSubjectTeachers;
          hasChange = true;
        }
      }

      if (hasChange) {
        classesToUpdate.push({
          classId: String(cls._id),
          classCode: (cls as any).classCode,
          updates,
          before: cls,
        });
      }
    }

    const report = {
      timestamp: new Date().toISOString(),
      totalClasses: classes.length,
      classesToUpdate: classesToUpdate.length,
      teacherIdUpdates,
      subjectTeacherUpdates,
      items: classesToUpdate.map((c) => ({
        classId: c.classId,
        classCode: c.classCode,
        updates: c.updates,
      })),
    };

    const reportPath = path.resolve(__dirname, "fixTeacherRefs.report.json");
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`Dry-run report written to ${reportPath}`);
    } catch (e) {
      console.warn("Could not write report file:", e);
    }

    console.log(
      `Dry-run summary: Classes to update: ${classesToUpdate.length}, class-level updates: ${teacherIdUpdates}, subjectTeachers updates: ${subjectTeacherUpdates}`,
    );

    if (!apply) {
      console.log("Run again with --apply to perform updates.");
      process.exit(0);
    }

    // Apply changes
    console.log("Applying updates...");
    let appliedCount = 0;
    for (const item of classesToUpdate) {
      const { classId, updates } = item;
      try {
        const clsDoc = await ClassModel.findById(classId);
        if (!clsDoc) continue;
        if (updates.teacherId) clsDoc.teacherId = updates.teacherId;
        if (updates.subjectTeachers)
          clsDoc.subjectTeachers = updates.subjectTeachers;
        await clsDoc.save();
        appliedCount++;
        console.log(`Updated class ${classId}`);
      } catch (e) {
        console.error(`Failed to update class ${classId}:`, e);
      }
    }

    console.log(`Done. Applied updates to ${appliedCount} classes.`);
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
