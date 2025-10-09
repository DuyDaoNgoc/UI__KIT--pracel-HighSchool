import { Request, Response } from "express";
import TeacherModel, { ITeacher } from "../../../models/teacherModel";

// Tạo mới giáo viên
export const createTeacher = async (req: Request, res: Response) => {
  try {
    const teacherData: Partial<ITeacher> = {
      ...req.body,
      gender: (req.body.gender as "Nam" | "Nữ" | "other") || "Nam", // ✅ ép kiểu
    };

    const newTeacher = new TeacherModel(teacherData);
    await newTeacher.save();

    res.status(201).json({ success: true, data: newTeacher });
  } catch (error: any) {
    console.error("❌ Lỗi tạo giáo viên:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Lấy danh sách giáo viên
export const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await TeacherModel.find();
    res.status(200).json({ success: true, data: teachers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
