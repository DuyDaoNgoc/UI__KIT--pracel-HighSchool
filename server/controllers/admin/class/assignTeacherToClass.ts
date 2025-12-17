// server/controllers/admin/class/assignTeacherToClass.ts

import { Request, Response } from "express";
import ClassModel from "../../../models/Class";
import mongoose from "mongoose";
import TeacherModel from "../../../models/teacherModel";
import { syncTeacherToUser } from "../../../utils/syncUserData";

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
