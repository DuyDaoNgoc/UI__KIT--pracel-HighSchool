// server/utils/syncUserData.ts
/**
 * Utility to sync teacher/student data from their source collections to the User collection.
 * This ensures that when a teacher or student record is updated anywhere,
 * their User document is also updated with the latest info.
 */

import { connectDB } from "../configs/db";
import { ObjectId } from "mongodb";

// Sync a teacher's data from teachers collection to users collection
export async function syncTeacherToUser(teacherData: any): Promise<void> {
  try {
    if (!teacherData || !teacherData.teacherId) {
      return;
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");

    // Extract relevant fields from teacher doc
    const updatePayload = {
      dob: teacherData.dob,
      phone: teacherData.phone,
      address: teacherData.address,
      major: teacherData.major || teacherData.majors,
      assignedClass: teacherData.assignedClass || [],
      // Add other fields as needed
    };

    // Remove undefined fields
    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key as keyof typeof updatePayload] === undefined) {
        delete updatePayload[key as keyof typeof updatePayload];
      }
    });

    await usersCollection.updateOne(
      { teacherId: teacherData.teacherId },
      { $set: updatePayload },
      { upsert: false }, // Don't create if doesn't exist
    );

    console.log(
      `✅ Synced teacher ${teacherData.teacherId} to users collection`,
    );
  } catch (err: any) {
    console.error("❌ syncTeacherToUser error:", err?.message || String(err));
    // Don't throw; sync failure should not block the main operation
  }
}

// Sync a student's data from students collection to users collection
export async function syncStudentToUser(studentData: any): Promise<void> {
  try {
    if (!studentData || !studentData.studentId) {
      return;
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");

    // Extract relevant fields from student doc
    const updatePayload = {
      dob: studentData.dob,
      phone: studentData.phone,
      address: studentData.address,
      residence: studentData.residence,
      schoolYear: studentData.schoolYear,
      gender: studentData.gender,
      classCode: studentData.classCode || studentData.classLetter,
      major: studentData.major,
      grade: studentData.grade,
    };

    // Remove undefined fields
    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key as keyof typeof updatePayload] === undefined) {
        delete updatePayload[key as keyof typeof updatePayload];
      }
    });

    await usersCollection.updateOne(
      { studentId: studentData.studentId },
      { $set: updatePayload },
      { upsert: false },
    );

    console.log(
      `✅ Synced student ${studentData.studentId} to users collection`,
    );
  } catch (err: any) {
    console.error("❌ syncStudentToUser error:", err?.message || String(err));
  }
}
