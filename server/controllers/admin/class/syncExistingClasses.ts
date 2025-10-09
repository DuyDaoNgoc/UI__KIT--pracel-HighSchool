import { Request, Response } from "express";
import mongoose from "mongoose";
import ClassModel from "../../../models/Class";
import UserModel from "../../../models/User";
import TeacherModel from "../../../models/teacherModel";

/**
 * 🔄 Đồng bộ lớp + ngành từ dữ liệu học sinh và giáo viên
 * ✅ Không tạo lớp mới, chỉ gắn dữ liệu nếu lớp đã tồn tại
 */
export const syncExistingClasses = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Lấy toàn bộ học sinh và giáo viên
    const students = await UserModel.find({ role: "student" }).lean();
    const teachers = await TeacherModel.find().lean();

    // 2️⃣ Duyệt từng học sinh
    for (const student of students) {
      const { schoolYear, classLetter, major, _id } = student;

      // Bỏ qua nếu thiếu dữ liệu
      if (!schoolYear || !classLetter || !major) continue;

      // Sinh classCode theo quy tắc (VD: 12A1CNTT)
      const majorAbbrev = major
        .split(/\s+/)
        .map((w: string) => w[0]?.toUpperCase() || "")
        .join("");
      const classCode = `${schoolYear}${classLetter}${majorAbbrev}`;

      // Tìm lớp đã tồn tại (không tạo mới)
      const cls = await ClassModel.findOne({ classCode, schoolYear, major });
      if (!cls) continue;

      const studentObjectId = new mongoose.Types.ObjectId(_id);

      // Thêm học sinh vào lớp nếu chưa có
      if (!cls.studentIds.some((id) => id.equals(studentObjectId))) {
        cls.studentIds.push(studentObjectId);
        await cls.save();
      }

      // Nếu lớp có teacherId thì gán lại teacherId cho học sinh
      if (cls.teacherId) {
        await UserModel.updateOne(
          { _id: studentObjectId },
          { $set: { teacherId: cls.teacherId } },
        );
      }
    }

    // 3️⃣ Duyệt từng giáo viên để đồng bộ học sinh theo ngành
    for (const teacher of teachers) {
      if (!teacher.majors || teacher.majors.length === 0) continue;

      for (const maj of teacher.majors) {
        // Tìm các lớp mà giáo viên đang phụ trách
        const classes = await ClassModel.find({
          major: maj,
          teacherId: teacher._id,
        });

        // Với mỗi lớp đó → gán teacherId cho toàn bộ học sinh
        for (const cls of classes) {
          if (cls.studentIds.length > 0) {
            await UserModel.updateMany(
              { _id: { $in: cls.studentIds } },
              { $set: { teacherId: teacher._id } },
            );
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "✅ Đồng bộ lớp và ngành thành công!",
    });
  } catch (err) {
    console.error("⚠️ syncExistingClasses error:", err);
    return res.status(500).json({
      success: false,
      message: "❌ Đồng bộ thất bại",
    });
  }
};
