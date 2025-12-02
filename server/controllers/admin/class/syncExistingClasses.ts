// src/controllers/admin/class/syncExistingClasses.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import ClassModel from "../../../models/Class";
import UserModel from "../../../models/User";
import TeacherModel from "../../../models/teacherModel";

export const syncExistingClasses = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Lấy toàn bộ học sinh và giáo viên
    const students = await UserModel.find({ role: "student" }).lean();
    const teachers = await TeacherModel.find().lean();

    // 2️⃣ Đồng bộ học sinh vào lớp
    for (const student of students) {
      const { schoolYear, classLetter, major, _id } = student;
      if (!schoolYear || !classLetter || !major) continue;

      const majorAbbrev = major
        .split(/\s+/)
        .map((w: string) => w[0]?.toUpperCase() || "")
        .join("");
      const classCode = `${schoolYear}${classLetter}${majorAbbrev}`;

      const cls = await ClassModel.findOne({ classCode, schoolYear, major });
      if (!cls) continue;

      const studentObjectId = new mongoose.Types.ObjectId(_id);

      // Thêm học sinh vào lớp nếu chưa có
      if (!cls.studentIds.some((id) => id.equals(studentObjectId))) {
        cls.studentIds.push(studentObjectId);
        await cls.save();
      }

      // Gán teacherId cho học sinh nếu lớp đã có giáo viên
      if (cls.teacherId) {
        await UserModel.updateOne(
          { _id: studentObjectId },
          { $set: { teacherId: cls.teacherId } },
        );
      }
    }

    for (const teacher of teachers) {
      if (!teacher.majors || teacher.majors.length === 0) continue;

      for (const maj of teacher.majors) {
        const classes = await ClassModel.find({
          major: maj,
          teacherId: teacher._id,
        }).select("studentIds");

        const studentIdsToUpdate: mongoose.Types.ObjectId[] = [];
        for (const cls of classes) {
          if (cls.studentIds.length > 0) {
            studentIdsToUpdate.push(...cls.studentIds);
          }
        }

        if (studentIdsToUpdate.length > 0) {
          await UserModel.updateMany(
            { _id: { $in: studentIdsToUpdate } },
            { $set: { teacherId: teacher._id } },
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "✅ Đồng bộ lớp và ngành thành công!",
    });
  } catch (err: any) {
    console.error("⚠️ syncExistingClasses error:", err);
    return res.status(500).json({
      success: false,
      message: "❌ Đồng bộ thất bại",
      error: err.message,
    });
  }
};
