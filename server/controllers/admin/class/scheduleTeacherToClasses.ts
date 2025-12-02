import { Request, Response } from "express";
import Teacher from "../../../models/teacherModel";
import Class from "../../../models/Class";
import mongoose from "mongoose";

export const scheduleTeacherToClasses = async (req: Request, res: Response) => {
  try {
    const { teacherId, assignments }: any = req.body;

    if (!teacherId || !assignments || !Array.isArray(assignments)) {
      return res.status(400).json({
        message: "teacherId và assignments là bắt buộc",
      });
    }

    // Lấy các classCode từ assignments React gửi
    const classCodes = assignments.map((a: any) => a.classCode);

    // Tìm giáo viên
    const teacher: any = await Teacher.findById(teacherId);
    if (!teacher)
      return res.status(404).json({ message: "Không tìm thấy giáo viên" });

    // Tìm danh sách lớp
    const classes: any = await Class.find({ classCode: { $in: classCodes } });
    if (!classes || classes.length === 0)
      return res.status(404).json({ message: "Không tìm thấy lớp để gán" });

    // GÁN GIÁO VIÊN CHO LỚP
    for (const cls of classes) {
      cls.teacherId = teacher._id;
      cls.teacherName = teacher.name; // fix tên luôn
      await cls.save();
    }

    // GÁN LỚP VÀO assignedClass CỦA TEACHER
    if (!Array.isArray(teacher.assignedClass)) teacher.assignedClass = [];

    for (const cls of classes) {
      const exists = teacher.assignedClass.find(
        (c: any) => c.classCode === cls.classCode,
      );

      if (!exists) {
        teacher.assignedClass.push({
          classCode: cls.classCode,
          className: `${cls.grade}${cls.classLetter} - ${cls.major} (${cls.schoolYear})`,
          grade: cls.grade,
          classLetter: cls.classLetter,
          schoolYear: cls.schoolYear,
          major: cls.major,
        });
      }
    }

    await teacher.save();

    res.status(200).json({
      message: "Gán giáo viên cho lớp thành công",
      data: {
        teacher: teacher.name,
        classes: classCodes,
      },
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
