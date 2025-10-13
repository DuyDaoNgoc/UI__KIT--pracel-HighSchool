import { Request, Response } from "express";
import mongoose from "mongoose";
import ClassModel from "../../../models/Class";
import UserModel from "../../../models/User";
import TeacherModel from "../../../models/teacherModel";
import { IUserDocument } from "../../../types/user";

interface IClassWithPopulate {
  _id: mongoose.Types.ObjectId;
  classCode: string;
  schoolYear: string;
  classLetter: string;
  major: string;
  className: string;
  teacherName?: string;
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
      .lean<IClassWithPopulate[]>();

    const groupedByMajor: Record<string, any[]> = {};

    for (const cls of classes) {
      const major = cls.major || "Chưa có ngành";
      if (!groupedByMajor[major]) groupedByMajor[major] = [];

      groupedByMajor[major].push({
        classCode: cls.classCode,
        className: cls.className,
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
    }

    return res.status(200).json(groupedByMajor);
  } catch (err) {
    console.error("⚠️ getAllClasses error:", err);
    return res.status(500).json({ message: "Lấy danh sách lớp thất bại" });
  }
};

export const createOrGetClass = async (req: Request, res: Response) => {
  try {
    const { schoolYear, classLetter, major, teacherId } = req.body;

    if (!major || !schoolYear || !classLetter) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const majorAbbrev = major
      .split(/\s+/)
      .map((w: string) => w[0]?.toUpperCase() || "")
      .join("");

    const classCode = `${schoolYear}${classLetter}${majorAbbrev}`;
    const className = `${schoolYear}${classLetter} - ${major}`;

    let cls = await ClassModel.findOne({ classCode, schoolYear, major });

    if (!cls) {
      cls = new ClassModel({
        schoolYear,
        classLetter,
        major,
        classCode,
        className,
        teacherId: teacherId
          ? new mongoose.Types.ObjectId(String(teacherId))
          : null,
        teacherName: "",
        studentIds: [],
      });
      await cls.save();
    }

    if (
      teacherId &&
      (!cls.teacherId ||
        !cls.teacherId.equals(new mongoose.Types.ObjectId(String(teacherId))))
    ) {
      const teacher = await TeacherModel.findById(teacherId);
      cls.teacherId = new mongoose.Types.ObjectId(String(teacherId));
      cls.teacherName = teacher?.name || "";
      await cls.save();

      if (cls.studentIds.length > 0) {
        await UserModel.updateMany(
          { _id: { $in: cls.studentIds } },
          { $set: { teacherId: cls.teacherId } },
        );
      }
    }

    return res.status(200).json(cls);
  } catch (err: any) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Lớp đã tồn tại (duplicate index)" });
    }
    console.error("⚠️ createOrGetClass error:", err);
    return res.status(500).json({ message: "Tạo hoặc lấy lớp thất bại" });
  }
};

export const addStudentToClass = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ message: "Thiếu thông tin học sinh" });
    }

    const student = await UserModel.findById(studentId).lean<IUserDocument>();
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy học sinh" });
    }

    const majorAbbrev = (student.major || "")
      .split(/\s+/)
      .map((w: string) => w[0]?.toUpperCase() || "")
      .join("");

    const classCode = `${student.schoolYear}${student.classLetter}${majorAbbrev}`;
    const className = `${student.schoolYear}${student.classLetter} - ${student.major}`;

    let cls = await ClassModel.findOne({
      classCode,
      schoolYear: student.schoolYear,
      major: student.major,
    });

    if (!cls) {
      cls = new ClassModel({
        schoolYear: student.schoolYear,
        classLetter: student.classLetter,
        major: student.major,
        classCode,
        className,
        teacherId: null,
        teacherName: "",
        studentIds: [],
      });
      await cls.save();
    }

    const studentObjectId = new mongoose.Types.ObjectId(String(studentId));
    if (!cls.studentIds.some((id) => id.equals(studentObjectId))) {
      cls.studentIds.push(studentObjectId);
      await cls.save();
    }

    if (cls.teacherId) {
      await UserModel.updateOne(
        { _id: studentObjectId },
        { $set: { teacherId: cls.teacherId } },
      );
    }

    const populated = await ClassModel.findById(cls._id)
      .populate({
        path: "studentIds",
        select: "studentId username major schoolYear classLetter",
      })
      .populate({
        path: "teacherId",
        select: "name subject majors",
      });

    return res.status(200).json(populated);
  } catch (err) {
    console.error("⚠️ addStudentToClass error:", err);
    return res.status(500).json({ message: "Thêm học sinh thất bại" });
  }
};

export const assignTeacher = async (req: Request, res: Response) => {
  try {
    const { classCode } = req.params;
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: "teacherId là bắt buộc" });
    }

    const teacher = await TeacherModel.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Không tìm thấy giáo viên" });
    }

    const match = classCode.match(/^(\d{4})([A-Za-z])([A-Z]+)$/);
    let schoolYear = "";
    let classLetter = "";
    let major = "";

    if (match) [, schoolYear, classLetter, major] = match;
    else if (teacher.majors?.length) major = teacher.majors[0];

    const className = `${schoolYear}${classLetter} - ${major}`;
    const teacherObjectId = new mongoose.Types.ObjectId(String(teacherId));

    let cls = await ClassModel.findOne({ classCode, schoolYear, major });

    if (!cls) {
      cls = new ClassModel({
        schoolYear,
        classLetter,
        major,
        classCode,
        className,
        teacherId: teacherObjectId,
        teacherName: teacher.name,
        studentIds: [],
      });
      await cls.save();
    } else {
      cls.teacherId = teacherObjectId;
      cls.teacherName = teacher.name;
      cls.schoolYear ||= schoolYear;
      cls.classLetter ||= classLetter;
      cls.major ||= major;
      await cls.save();
    }

    if (cls.studentIds.length > 0) {
      await UserModel.updateMany(
        { _id: { $in: cls.studentIds } },
        { $set: { teacherId: teacherObjectId } },
      );
    }

    return res.status(200).json(cls);
  } catch (err) {
    console.error("⚠️ assignTeacher error:", err);
    return res.status(500).json({ message: "Gán giáo viên thất bại" });
  }
};
