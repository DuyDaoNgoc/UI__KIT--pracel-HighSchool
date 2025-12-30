// server/controllers/admin/class/assignTeacherToClass.ts

import { Request, Response } from "express";
import ClassModel from "../../../models/Class";
import mongoose from "mongoose";
import TeacherModel from "../../../models/teacherModel";
import StudentModel from "../../../models/Student";
import User from "../../../models/User";
import { syncTeacherToUser } from "../../../utils/syncUserData";
import { getIo } from "../../../utils/socketio";

export const assignTeacherToClass = async (req: Request, res: Response) => {
  try {
    const { teacherId, classes, assignments } = req.body;

    // Nhận cả classes hoặc assignments
    const classesData = classes || assignments;

    if (!teacherId || !Array.isArray(classesData)) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu lớp không hợp lệ!",
      });
    }

    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    for (const item of classesData) {
      const { classCode, type } = item;

      const cls = await ClassModel.findOne({ classCode });
      if (!cls) continue;

      if (type === "homeroom") {
        cls.teacherId = teacherObjectId;
      }

      await cls.save();

      // Also add this class to the Teacher.assignedClass array (avoid duplicates)
      try {
        await TeacherModel.updateOne(
          { _id: teacherObjectId },
          {
            $addToSet: {
              assignedClass: {
                grade: cls.grade,
                classLetter: cls.classLetter,
                major: cls.major,
                schoolYear: cls.schoolYear,
                classCode: cls.classCode,
                className: cls.className || "",
                role: type || "",
              },
            },
          },
        );
        console.log(
          `✅ Added class ${cls.classCode} to Teacher ${teacherObjectId}`,
        );
      } catch (e: any) {
        console.error(
          "Failed to update Teacher.assignedClass:",
          e?.message || e,
        );
      }

      // ✅ Also update student records (both StudentModel and User) for this class
      try {
        // Fetch teacher document to get teacherId string
        const teacherDoc = await TeacherModel.findById(teacherObjectId).lean();
        const teacherIdentifier = teacherDoc?.teacherId || null;

        if (teacherIdentifier) {
          // Update StudentModel documents' teacherId field
          await StudentModel.updateMany(
            { classCode: cls.classCode },
            { $set: { teacherId: teacherIdentifier } },
          );

          // Update User documents for students in this class: set teacherId and teacherRef
          await User.updateMany(
            { classCode: cls.classCode, role: "student" },
            {
              $set: {
                teacherId: teacherIdentifier,
                teacherRef: teacherObjectId,
              },
            },
          );

          console.log(
            `✅ Updated students in class ${cls.classCode} with teacher ${teacherIdentifier}`,
          );

          // Emit socket events to notify affected users and admins
          try {
            const io = getIo();
            if (io) {
              // Notify admins
              io.to("role:admin").emit("class:teacherAssigned", {
                classCode: cls.classCode,
                teacherId: teacherIdentifier,
                teacherName: teacherDoc?.name || null,
              });

              // Fetch students in this class to emit per-user updates
              const studentsInClass = await User.find({
                classCode: cls.classCode,
                role: "student",
              }).lean();
              for (const s of studentsInClass) {
                try {
                  io.to(`user:${s.studentId}`).emit("student:updated", {
                    studentId: s.studentId,
                    classCode: cls.classCode,
                    teacherId: teacherIdentifier,
                  });
                } catch (e) {
                  /* ignore individual emit errors */
                }
              }

              // Notify the teacher's user room as well
              io.to(`user:${teacherIdentifier}`).emit(
                "teacher:assignedToClass",
                {
                  classCode: cls.classCode,
                },
              );
            }
          } catch (emitErr) {
            console.warn(
              "⚠️ [assignTeacherToClass] Socket emit failed:",
              emitErr,
            );
          }
        }
      } catch (updateStudentsErr) {
        console.warn(
          `⚠️ Could not update student/User records for class ${cls.classCode}:`,
          updateStudentsErr,
        );
      }
    }

    // ✅ Fetch updated teacher and sync to users collection
    const updatedTeacher = await TeacherModel.findOne({
      _id: teacherObjectId,
    }).lean();
    if (updatedTeacher) {
      console.log(
        `📝 [assignTeacherToClass] Syncing teacher ${updatedTeacher.teacherId} with assignedClass:`,
        updatedTeacher.assignedClass,
      );
      await syncTeacherToUser(updatedTeacher);
    }

    return res.json({
      success: true,
      message: "Gán giáo viên thành công!",
    });
  } catch (err: any) {
    console.error("assignTeacherToClass error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: err.message,
    });
  }
};
