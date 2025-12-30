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
      console.warn("⚠️ syncTeacherToUser: missing teacherId or teacherData");
      return;
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");

    // Extract relevant fields from teacher doc (only non-empty values)
    const updatePayload: any = {};

    if (teacherData.dob) updatePayload.dob = teacherData.dob;
    if (teacherData.phone) updatePayload.phone = teacherData.phone;
    if (teacherData.address) updatePayload.address = teacherData.address;
    // Prefer storing both a string `major` (for backward compatibility)
    // and an array `majors` so frontend can consume either format.
    if (teacherData.major) updatePayload.major = teacherData.major;
    if (teacherData.majors) {
      updatePayload.majors = teacherData.majors;
      // If major (string) not provided, create one from majors array
      if (!updatePayload.major) {
        updatePayload.major = Array.isArray(teacherData.majors)
          ? teacherData.majors.join(", ")
          : String(teacherData.majors);
      }
    }
    if (teacherData.assignedClass) {
      updatePayload.assignedClass = teacherData.assignedClass;
    }

    // If teacherData has an _id (Teacher doc), set teacherRef on User for direct reference
    if (teacherData._id) {
      try {
        updatePayload.teacherRef =
          typeof teacherData._id === "string"
            ? teacherData._id
            : String(teacherData._id);
      } catch (e) {
        // ignore
      }
    }

    console.log(
      `📝 [syncTeacherToUser] Syncing teacher ${teacherData.teacherId} with payload:`,
      updatePayload,
    );

    const result = await usersCollection.updateOne(
      { teacherId: teacherData.teacherId },
      { $set: updatePayload },
      { upsert: false },
    );

    if (result.matchedCount === 0) {
      console.warn(
        `⚠️ [syncTeacherToUser] No user found for teacherId ${teacherData.teacherId}`,
      );
    } else if (result.modifiedCount > 0) {
      console.log(
        `✅ [syncTeacherToUser] Synced teacher ${teacherData.teacherId} to users collection`,
      );
    } else {
      console.log(
        `ℹ️ [syncTeacherToUser] User ${teacherData.teacherId} already up-to-date`,
      );
    }
  } catch (err: any) {
    console.error("❌ syncTeacherToUser error:", err?.message || String(err));
  }
}

// Sync a student's data from students collection to users collection
export async function syncStudentToUser(studentData: any): Promise<void> {
  try {
    if (!studentData || !studentData.studentId) {
      console.warn("⚠️ syncStudentToUser: missing studentId or studentData");
      return;
    }

    const db = await connectDB();
    const usersCollection = db.collection("users");

    // Extract relevant fields from student doc (only non-empty values)
    // NOTE: Only sync fields that exist in User schema (no residence, gender, grade)
    // ENSURE: normalize types to match schema validators (string, Date, etc.)
    const updatePayload: any = {};

    // Normalize dob to Date
    if (studentData.dob) {
      updatePayload.dob =
        studentData.dob instanceof Date
          ? studentData.dob
          : new Date(studentData.dob);
    }
    // Normalize string fields
    if (studentData.phone)
      updatePayload.phone = String(studentData.phone).trim();
    if (studentData.address)
      updatePayload.address = String(studentData.address).trim();
    if (studentData.schoolYear)
      updatePayload.schoolYear = String(studentData.schoolYear).trim();

    // classCode: prefer classCode over classLetter
    if (studentData.classCode)
      updatePayload.classCode = String(studentData.classCode).trim();
    else if (studentData.classLetter)
      updatePayload.classCode = String(studentData.classLetter).trim();

    // If studentData has an _id (Student doc), set studentRef on User for direct reference
    if (studentData._id) {
      try {
        updatePayload.studentRef =
          typeof studentData._id === "string"
            ? studentData._id
            : String(studentData._id);
      } catch (e) {
        // ignore
      }
    }

    // If studentData contains a teacherId (code), sync it to User.teacherId
    if (studentData.teacherId) {
      try {
        updatePayload.teacherId = String(studentData.teacherId);
      } catch (e) {
        // ignore
      }
    }

    // major: convert to string (handle arrays or objects)
    if (studentData.major) {
      if (Array.isArray(studentData.major)) {
        updatePayload.major = studentData.major.join(", ");
      } else if (
        typeof studentData.major === "object" &&
        studentData.major !== null
      ) {
        // If major is an object, try to get name or convert to string
        updatePayload.major =
          studentData.major.name || String(studentData.major);
      } else {
        updatePayload.major = String(studentData.major).trim();
      }
    }

    console.log(
      `📝 [syncStudentToUser] Syncing student ${studentData.studentId} with payload:`,
      updatePayload,
    );

    const result = await usersCollection.updateOne(
      { studentId: studentData.studentId },
      { $set: updatePayload },
      { upsert: false },
    );

    if (result.matchedCount === 0) {
      console.warn(
        `⚠️ [syncStudentToUser] No user found for studentId ${studentData.studentId}`,
      );
    } else if (result.modifiedCount > 0) {
      console.log(
        `✅ [syncStudentToUser] Synced student ${studentData.studentId} to users collection`,
      );
    } else {
      console.log(
        `ℹ️ [syncStudentToUser] User ${studentData.studentId} already up-to-date`,
      );
    }
  } catch (err: any) {
    console.error("❌ syncStudentToUser error:", err?.message || String(err));
  }
}

// ✅ Sync student grades from Grade collection to User collection
export async function syncStudentGradesToUser(
  studentId: string,
): Promise<void> {
  try {
    if (!studentId) {
      console.warn("⚠️ syncStudentGradesToUser: missing studentId");
      return;
    }

    const db = await connectDB();
    const gradesCollection = db.collection("grades");
    const usersCollection = db.collection("users");

    // Get all grades for this student. Handle cases where studentId in grades is stored
    // as an ObjectId or as a string.
    const gradeQuery: any = { $or: [{ studentId: studentId }] };
    try {
      const objId = new ObjectId(studentId);
      gradeQuery.$or.push({ studentId: objId });
    } catch (e) {
      // not a valid ObjectId, ignore
    }
    const grades = await gradesCollection.find(gradeQuery).toArray();

    // Resolve subjectId to subjectName for display
    const SubjectModel = require("../models/Subject").default;

    const gradesPayload = [];
    for (const g of grades) {
      // Compute a numeric score: prefer averageScore, else compute average from g.grades array
      let scoreVal: number | null = null;
      if (typeof g.averageScore === "number") {
        scoreVal = g.averageScore;
      } else if (Array.isArray(g.grades) && g.grades.length > 0) {
        const vals = g.grades
          .map((it: any) =>
            typeof it.score === "number" ? it.score : parseFloat(it.score),
          )
          .filter((n: any) => !isNaN(n));
        if (vals.length > 0) {
          const avg =
            vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
          scoreVal = Math.round(avg * 10) / 10;
        }
      }

      if (scoreVal === null || scoreVal === undefined) continue;

      let subjectName = "Unknown";
      if (g.subjectId) {
        try {
          const subject = await SubjectModel.findById(g.subjectId).lean();
          if (subject) subjectName = subject.name;
        } catch (e) {
          console.warn(`⚠️ Could not resolve subjectId ${g.subjectId}`);
        }
      }

      gradesPayload.push({
        subject: subjectName, // use resolved name instead of stringified id
        score: scoreVal,
      });
    }

    console.log(
      `📝 [syncStudentGradesToUser] Syncing ${gradesPayload.length} grades for student ${studentId}`,
    );

    // Resolve possible user filter: Users store `studentId` as the student code
    // (e.g. 'HS0001') while some code calls this function with the Student
    // document _id (ObjectId). Try to update by `studentRef` (string _id),
    // or by `studentId` (code) if available.
    let userFilter: any = { $or: [{ studentId: studentId }] };
    try {
      // if studentId looks like ObjectId, also try studentRef match
      const maybeObj = new ObjectId(studentId);
      userFilter.$or.push({ studentRef: String(maybeObj) });

      // Also attempt to load Student doc to get its studentId/code
      try {
        const StudentModel = require("../models/Student").default;
        const studentDoc = await StudentModel.findById(String(maybeObj)).lean();
        if (studentDoc && studentDoc.studentId) {
          userFilter.$or.push({ studentId: String(studentDoc.studentId) });
        }
      } catch (e) {
        // ignore if Student model lookup fails
      }
    } catch (e) {
      // not an ObjectId — still try matching studentId directly
    }

    const result = await usersCollection.updateOne(
      userFilter,
      { $set: { grades: gradesPayload } },
      { upsert: false },
    );

    if (result.matchedCount === 0) {
      console.warn(
        `⚠️ [syncStudentGradesToUser] No user found for student identifier ${studentId}`,
      );
    } else if (result.modifiedCount > 0) {
      console.log(
        `✅ [syncStudentGradesToUser] Synced ${gradesPayload.length} grades for student ${studentId}`,
      );
    }
  } catch (err: any) {
    console.error(
      "❌ syncStudentGradesToUser error:",
      err?.message || String(err),
    );
  }
}
