// src/controllers/admin/class/assignTeacherToClass.ts
import { Request, Response } from "express";
import Teacher from "../../../models/teacherModel";
import Class from "../../../models/Class";

export const assignTeacherToClass = async (req: Request, res: Response) => {
  try {
    const { teacherId, classCode } = req.body;

    const foundClass = await Class.findOne({ classCode });
    if (!foundClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Tạo tên lớp gộp từ schema có sẵn
    const className = `${foundClass.grade}${foundClass.classLetter} - ${foundClass.major} (${foundClass.schoolYear})`;

    // gán giáo viên vào lớp
    foundClass.teacherId = teacher._id as any;
    foundClass.teacherName = teacher.name; // teacher có field name
    await foundClass.save();

    // cập nhật trong Teacher (nếu schema hỗ trợ)
    teacher.assignedClass = {
      classCode: foundClass.classCode,
      className,
      grade: foundClass.grade,
      classLetter: foundClass.classLetter,
      schoolYear: foundClass.schoolYear,
      major: foundClass.major,
    };

    await teacher.save();

    res.json({
      message: "Assign teacher to class success",
      data: {
        teacher: teacher.name,
        class: className,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
