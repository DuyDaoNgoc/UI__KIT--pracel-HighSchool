// src/controllers/classController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import ClassModel from "../models/Class";
import UserModel from "../models/User";
import { IUserDocument } from "../types/user";

// ==== Lấy tất cả lớp, có kèm học sinh chi tiết ====
export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const classes = await ClassModel.find()
      .populate({
        path: "studentIds",
        select: "studentId username major schoolYear classLetter",
      })
      .lean();

    const groupedByMajor: Record<string, any[]> = {};
    classes.forEach((cls) => {
      const major = cls.major || "Chưa có ngành";
      if (!groupedByMajor[major]) groupedByMajor[major] = [];

      groupedByMajor[major].push({
        classCode: cls.classCode,
        grade: cls.schoolYear,
        classLetter: cls.classLetter,
        teacherName: cls.teacherName,
        students: cls.studentIds.map((s: any) => ({
          studentId: s.studentId,
          name: s.username,
        })),
      });
    });

    res.status(200).json(groupedByMajor);
  } catch (err) {
    console.error("⚠️ getAllClasses error:", err);
    res.status(500).json({ message: "Lấy danh sách lớp thất bại" });
  }
};

// ==== Tạo hoặc lấy lớp (tự động tạo nếu chưa có) ====
export const createOrGetClass = async (req: Request, res: Response) => {
  try {
    const { schoolYear, classLetter, major, teacherName } = req.body;

    if (!major || !schoolYear || !classLetter) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    // viết tắt ngành
    const majorAbbrev = major
      .split(/\s+/)
      .map((w: string) => (w ? w[0].toUpperCase() : ""))
      .join("");

    const classCode = `${schoolYear}${classLetter}${majorAbbrev}`;

    let cls = await ClassModel.findOne({ classCode, major });

    if (!cls) {
      cls = await ClassModel.create({
        schoolYear,
        classLetter,
        major,
        classCode,
        teacherName: teacherName || null,
        studentIds: [],
      });
    } else if (teacherName && cls.teacherName !== teacherName) {
      cls.teacherName = teacherName;
      await cls.save();

      if (cls.studentIds.length > 0) {
        await UserModel.updateMany(
          { _id: { $in: cls.studentIds } },
          { $set: { teacherId: teacherName } }
        );
      }
    }

    res.status(200).json(cls);
  } catch (err) {
    console.error("⚠️ createOrGetClass error:", err);
    res.status(500).json({ message: "Tạo hoặc lấy lớp thất bại" });
  }
};

// ==== Thêm học sinh vào lớp ====
export const addStudentToClass = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const student = await UserModel.findById(studentId).lean<IUserDocument>();
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học sinh" });
    }

    // xác định classCode của học sinh
    let classCode = student.classCode;
    if (!classCode) {
      const majorAbbrev = (student.major || "")
        .split(/\s+/)
        .map((w: string) => (w ? w[0].toUpperCase() : ""))
        .join("");
      classCode = `${student.schoolYear}${student.classLetter}${majorAbbrev}`;
    }

    let cls = await ClassModel.findOne({ classCode, major: student.major });

    if (!cls) {
      cls = await ClassModel.create({
        schoolYear: student.schoolYear,
        classLetter: student.classLetter,
        major: student.major,
        classCode,
        teacherName: null,
        studentIds: [],
      });
    }

    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    if (
      !cls.studentIds.some((id: mongoose.Types.ObjectId) =>
        id.equals(studentObjectId)
      )
    ) {
      cls.studentIds.push(studentObjectId);
      await cls.save();
    }

    if (cls.teacherName) {
      await UserModel.updateOne(
        { _id: studentObjectId },
        { $set: { teacherId: cls.teacherName } }
      );
    }

    const populatedCls = await ClassModel.findById(cls._id).populate({
      path: "studentIds",
      select: "studentId username major schoolYear classLetter",
    });

    res.status(200).json(populatedCls);
  } catch (err) {
    console.error("⚠️ addStudentToClass error:", err);
    res.status(500).json({ message: "Thêm học sinh thất bại" });
  }
};

// ==== Gán giáo viên cho lớp ====
export const assignTeacher = async (req: Request, res: Response) => {
  try {
    const { classCode } = req.params;
    const { teacherName } = req.body;

    if (!teacherName) {
      return res.status(400).json({ message: "teacherName là bắt buộc" });
    }

    const cls = await ClassModel.findOneAndUpdate(
      { classCode },
      { teacherName },
      { new: true }
    );

    if (!cls) {
      return res.status(404).json({ message: "Lớp không tồn tại" });
    }

    if (cls.studentIds.length > 0) {
      await UserModel.updateMany(
        { _id: { $in: cls.studentIds } },
        { $set: { teacherId: teacherName } }
      );
    }

    res.status(200).json(cls);
  } catch (err) {
    console.error("⚠️ assignTeacher error:", err);
    res.status(500).json({ message: "Gán giáo viên thất bại" });
  }
};
