// backend/controllers/teachersController.ts
import { Request, Response } from "express";
import Teacher, { ITeacher } from "../models/teacherModel";
import ClassModel, { IClass } from "../models/Class";
import bcrypt from "bcryptjs";

// ==== Types cho params và body ====
interface AssignTeacherParams {
  classCode: string;
}

interface AssignTeacherBody {
  teacherId: string;
  grade: string;
  classLetter: string;
  schoolYear: string;
  major?: string;
}

// ==== Tạo giáo viên mới ====
export const createTeacher = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin giáo viên (name, email, password).",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(String(password), 10);

    const teacher = new Teacher({
      name: String(name),
      email: String(email),
      password: hashedPassword,
    });

    await teacher.save();

    return res.status(201).json({
      success: true,
      message: "Tạo giáo viên thành công.",
      data: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
      },
    });
  } catch (err: unknown) {
    console.error("❌ [createTeacher] Error:", err);

    // ✅ ép kiểu an toàn cho TS
    const errorMessage: string =
      err instanceof Error ? err.message : String(err);

    return res.status(500).json({
      success: false,
      message: "Tạo giáo viên thất bại.",
      error: errorMessage,
    });
  }
};

// ==== Gán giáo viên vào lớp và đồng bộ Class ====
export const assignTeacherToClass = async (
  req: Request<AssignTeacherParams, any, AssignTeacherBody>,
  res: Response
) => {
  try {
    const { classCode } = req.params;
    const { teacherId, grade, classLetter, schoolYear, major } = req.body;

    if (!teacherId || !classCode || !grade || !classLetter || !schoolYear) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin bắt buộc (teacherId, classCode, grade, classLetter, schoolYear).",
      });
    }

    // === Tìm giáo viên ===
    const teacher: ITeacher | null = await Teacher.findById(teacherId);
    if (!teacher) {
      return res
        .status(404)
        .json({ success: false, message: "Giáo viên không tồn tại." });
    }

    // === Tìm class theo classCode + schoolYear ===
    let existingClass: IClass | null = await ClassModel.findOne({
      classCode,
      schoolYear,
    });

    if (existingClass) {
      // Update teacher nếu đã có class
      existingClass.teacherId = String(teacher._id);
      existingClass.teacherName = teacher.name;
      await existingClass.save();
    } else {
      // Tạo mới class với đầy đủ thông tin
      existingClass = await new ClassModel({
        classCode,
        grade: String(grade),
        classLetter: String(classLetter),
        schoolYear: String(schoolYear),
        major: major ?? "",
        studentIds: [], // danh sách studentId
        teacherId: teacher._id,
        teacherName: teacher.name,
        createdAt: new Date(),
      }).save();
    }

    // === Đồng bộ teacher ===
    teacher.assignedClassCode = classCode;
    await teacher.save();

    return res.status(200).json({
      success: true,
      message: "Gán giáo viên vào lớp thành công và đồng bộ lớp.",
      data: {
        teacher: {
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          assignedClassCode: teacher.assignedClassCode,
        },
        class: existingClass,
      },
    });
  } catch (err: unknown) {
    console.error("❌ [assignTeacherToClass] Error:", err);

    const errorMessage: string =
      err instanceof Error ? err.message : String(err);

    return res.status(500).json({
      success: false,
      message: "Gán giáo viên thất bại.",
      error: errorMessage,
    });
  }
};
