// src/controllers/classController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import ClassModel from "../../../models/Class";
import UserModel from "../../../models/User";

import { IUserDocument } from "../../../types/user";
import TeacherModel from "../../../models/teacherModel";

// ==== Kiểu dữ liệu cho Class sau khi populate ====
interface IClassWithPopulate {
  classCode: string;
  schoolYear: string;
  classLetter: string;
  major: string;
  studentIds: {
    _id: mongoose.Types.ObjectId;
    studentId: string;
    username: string;
    major: string;
    schoolYear: string;
    classLetter: string;
  }[];
  teacherId: null | {
    _id: mongoose.Types.ObjectId;
    name: string;
    subject?: string;
    majors?: string[];
  };
}

// ==== Lấy tất cả lớp, có kèm học sinh + giáo viên chi tiết ====
export const getAllClasses = async (req: Request, res: Response) => {
  try {
    const classes = await ClassModel.find()
      .populate({
        path: "studentIds",
        select: "studentId username major schoolYear classLetter",
      })
      .populate({
        path: "teacherId",
        select: "name subject majors",
      })
      .lean<IClassWithPopulate[]>(); // ✅ ép kiểu

    const groupedByMajor: Record<string, any[]> = {};
    classes.forEach((cls) => {
      const major = cls.major || "Chưa có ngành";
      if (!groupedByMajor[major]) groupedByMajor[major] = [];

      groupedByMajor[major].push({
        classCode: cls.classCode,
        grade: cls.schoolYear,
        classLetter: cls.classLetter,
        teacher: cls.teacherId
          ? {
              id: cls.teacherId._id,
              name: cls.teacherId.name,
              subject: cls.teacherId.subject,
            }
          : null,
        students: cls.studentIds.map((s) => ({
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

// ==== Tạo hoặc lấy lớp ====
export const createOrGetClass = async (req: Request, res: Response) => {
  try {
    const { schoolYear, classLetter, major, teacherId } = req.body;

    if (!major || !schoolYear || !classLetter) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

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
        teacherId: teacherId ? new mongoose.Types.ObjectId(teacherId) : null,
        studentIds: [],
      });
    } else if (teacherId && !cls.teacherId?.equals(teacherId)) {
      cls.teacherId = new mongoose.Types.ObjectId(teacherId);
      await cls.save();

      if (cls.studentIds.length > 0) {
        await UserModel.updateMany(
          { _id: { $in: cls.studentIds } },
          { $set: { teacherId: cls.teacherId } }
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
        teacherId: null,
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

    if (cls.teacherId) {
      await UserModel.updateOne(
        { _id: studentObjectId },
        { $set: { teacherId: cls.teacherId } }
      );
    }

    const populatedCls = await ClassModel.findById(cls._id)
      .populate({
        path: "studentIds",
        select: "studentId username major schoolYear classLetter",
      })
      .populate({
        path: "teacherId",
        select: "name subject majors",
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
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: "teacherId là bắt buộc" });
    }

    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const teacher = await TeacherModel.findById(teacherObjectId);
    if (!teacher) {
      return res.status(404).json({ message: "Không tìm thấy giáo viên" });
    }

    let cls = await ClassModel.findOne({ classCode });
    if (!cls) {
      cls = await ClassModel.create({
        schoolYear: "",
        classLetter: "",
        major: "",
        classCode,
        teacherId: teacherObjectId,
        studentIds: [],
      });
    } else {
      cls.teacherId = teacherObjectId;
      await cls.save();
    }

    if (cls.studentIds.length > 0) {
      await UserModel.updateMany(
        { _id: { $in: cls.studentIds } },
        { $set: { teacherId: teacherObjectId } }
      );
    }

    res.status(200).json(cls);
  } catch (err) {
    console.error("⚠️ assignTeacher error:", err);
    res.status(500).json({ message: "Gán giáo viên thất bại" });
  }
};
