// server/controllers/admin/class/assignTeacherToClass.ts

import { Request, Response } from "express";
import ClassModel from "../../../models/Class";
import mongoose from "mongoose";

export const assignTeacherToClass = async (req: Request, res: Response) => {
  try {
    const { teacherId, classes } = req.body;

    if (!teacherId || !Array.isArray(classes)) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu lớp không hợp lệ!",
      });
    }

    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    for (const item of classes) {
      const { classCode, type } = item;

      const cls = await ClassModel.findOne({ classCode });
      if (!cls) continue;

      if (type === "homeroom") {
        cls.teacherId = teacherObjectId;
      }

      await cls.save();
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
