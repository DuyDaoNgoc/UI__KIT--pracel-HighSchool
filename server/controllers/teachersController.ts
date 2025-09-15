// backend/controllers/teachersController.ts
import { Request, Response } from "express";
import Teacher from "../models/teacherModel";
import bcrypt from "bcryptjs";

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Thiếu thông tin giáo viên" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = new Teacher({
      name,
      email,
      password: hashedPassword,
    });

    await teacher.save();
    res
      .status(201)
      .json({ _id: teacher._id, name: teacher.name, email: teacher.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Tạo giáo viên thất bại" });
  }
};

// Gán giáo viên vào lớp
export const assignTeacherToClass = async (req: Request, res: Response) => {
  try {
    const { classCode } = req.params;
    const { teacherId } = req.body;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher)
      return res.status(404).json({ message: "Giáo viên không tồn tại" });

    teacher.assignedClassCode = classCode;
    await teacher.save();

    res.status(200).json({ message: "Gán giáo viên vào lớp thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gán giáo viên thất bại" });
  }
};
