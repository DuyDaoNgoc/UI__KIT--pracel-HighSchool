/**
 * Migration script: Convert class.subjectTeachers from string-based to subjectId-based schema
 *
 * Old format: { subject: string, teacherId, teacherName }
 * New format: { subjectId: ObjectId, subjectName: string, teacherId: ObjectId, teacherName: string }
 *
 * Usage: npx ts-node server/migrations/migrateSubjectTeachers.ts
 */

import mongoose from "mongoose";
import { connectDB } from "../configs/db";
import ClassModel from "../models/Class";
import SubjectModel from "../models/Subject";

async function migrateSubjectTeachers() {
  try {
    console.log("🚀 [Migration] Starting subjectTeachers migration...");

    // Connect to DB
    const db = await connectDB();
    console.log("✅ [Migration] Connected to MongoDB");

    // Get all classes with subjectTeachers array
    const classes = await ClassModel.find({
      subjectTeachers: { $exists: true, $ne: [] },
    }).lean();

    console.log(
      ` [Migration] Found ${classes.length} classes with subjectTeachers`,
    );

    let migratedCount = 0;
    let skippedCount = 0;

    for (const cls of classes) {
      const subjectTeachers = cls.subjectTeachers || [];

      // Check if any entry is in old format (subject: string)
      const needsMigration = subjectTeachers.some(
        (st: any) => typeof st.subject === "string" && !st.subjectId, // old format
      );

      if (!needsMigration) {
        console.log(`  [Migration] Class ${cls._id} already migrated`);
        skippedCount++;
        continue;
      }

      console.log(
        `\n📝 [Migration] Migrating class ${cls.classCode} (${cls._id})`,
      );
      console.log(`   Old subjectTeachers:`, subjectTeachers);

      // Migrate each entry
      const newSubjectTeachers: Array<{
        subjectId: mongoose.Types.ObjectId;
        subjectName: string;
        teacherId: mongoose.Types.ObjectId;
        teacherName: string;
      }> = [];

      for (const entry of subjectTeachers) {
        try {
          let subjectId: mongoose.Types.ObjectId | null = null;
          let subjectName: string = "";

          // Check if entry already has subjectId (new format)
          if ((entry as any).subjectId) {
            // Already in new format
            subjectId = (entry as any).subjectId;
            subjectName = (entry as any).subjectName || "Unknown";
          } else if ((entry as any).subject) {
            // Old format: find or create Subject by name
            const subjectNameStr = (entry as any).subject as string;
            let subject: any = await SubjectModel.findOne({
              name: subjectNameStr,
            }).lean();

            if (!subject) {
              console.log(
                `   🆕 Creating global Subject for "${subjectNameStr}"`,
              );
              const newSubject = await SubjectModel.create({
                name: subjectNameStr,
                price: 0, // default price
              });
              subject = newSubject.toObject
                ? newSubject.toObject()
                : newSubject;
            } else {
              console.log(
                `   ✅ Found existing Subject "${subjectNameStr}" (${subject._id})`,
              );
            }

            if (subject) {
              subjectId = subject._id as mongoose.Types.ObjectId;
              subjectName = subject.name as string;
            } else {
              console.warn(
                `   ⚠️  Failed to create/find subject for "${subjectNameStr}", skipping entry`,
              );
              continue;
            }
          } else {
            console.warn(
              `   ⚠️  Entry has neither subject nor subjectId, skipping:`,
              entry,
            );
            continue;
          }

          if (!subjectId || !subjectName) {
            console.warn(
              `   ⚠️  Failed to resolve subject, skipping entry:`,
              entry,
            );
            continue;
          }

          // Push new format entry
          newSubjectTeachers.push({
            subjectId,
            subjectName,
            teacherId: (entry as any).teacherId as mongoose.Types.ObjectId,
            teacherName: ((entry as any).teacherName || "Unknown") as string,
          });
        } catch (entryErr: any) {
          console.error(
            `   ❌ Error migrating entry ${JSON.stringify(entry)}:`,
            entryErr?.message,
          );
        }
      }

      // Update class with new subjectTeachers
      await ClassModel.updateOne(
        { _id: cls._id },
        { $set: { subjectTeachers: newSubjectTeachers } },
      );

      console.log(`   ✅ Migrated ${newSubjectTeachers.length} entries`);
      console.log(`   New subjectTeachers:`, newSubjectTeachers);

      migratedCount++;
    }

    console.log(`\n✨ [Migration] Complete!`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${classes.length}`);

    process.exit(0);
  } catch (err: any) {
    console.error("❌ [Migration] Error:", err?.message || err);
    process.exit(1);
  }
}

// Run migration
migrateSubjectTeachers();
