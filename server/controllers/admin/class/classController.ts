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

/* =============================
 * 📘 LẤY DANH SÁCH TOÀN BỘ LỚP
 * ============================= */
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
  } catch (err: any) {
    console.error("⚠️ getAllClasses error:", err);
    return res
      .status(500)
      .json({ message: "Lấy danh sách lớp thất bại", error: err.message });
  }
};
// =====================================
// 🏫 TẠO HOẶC LẤY LỚP NẾU ĐÃ TỒN TẠI
// =====================================
export const createClass = async (req: Request, res: Response) => {
  try {
    const { schoolYear, classLetter, major, teacherId } = req.body;

    if (!major || !schoolYear || !classLetter) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (schoolYear, classLetter, major)",
      });
    }

    // ✅ grade luôn có giá trị (ép kiểu chuẩn)
    const grade =
      typeof schoolYear === "number"
        ? schoolYear.toString()
        : String(schoolYear).trim();

    const majorAbbrev = major
      .split(/\s+/)
      .map((w: string) => w[0]?.toUpperCase() || "")
      .join("");

    const classCode = `${grade}${classLetter}${majorAbbrev}`;
    const className = `${grade}${classLetter} - ${major}`;

    // 🔍 Tìm lớp nếu đã tồn tại
    let cls = await ClassModel.findOne({
      classCode,
      schoolYear: grade,
      major,
    });

    if (!cls) {
      cls = new ClassModel({
        grade,
        schoolYear: grade,
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

    // 👩‍🏫 Nếu có teacherId → cập nhật thêm
    if (teacherId) {
      const teacher = await TeacherModel.findById(teacherId);
      if (teacher) {
        cls.teacherId = new mongoose.Types.ObjectId(String(teacherId));
        cls.teacherName = teacher.name;
        await cls.save();

        if (cls.studentIds?.length > 0) {
          await UserModel.updateMany(
            { _id: { $in: cls.studentIds } },
            { $set: { teacherId: cls.teacherId } },
          );
        }
      }
    }

    return res.status(201).json({ success: true, data: cls });
  } catch (err: any) {
    console.error("⚠️ createClass error:", err.message);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ: " + err.message,
      });
    }

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Lớp đã tồn tại (duplicate index)",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Tạo lớp thất bại",
      error: err.message,
    });
  }
};

/* ==================================
 * 👨‍🎓 THÊM HỌC SINH VÀO LỚP
 * ================================== */
export const addStudentToClass = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.body;
    if (!studentId)
      return res.status(400).json({ message: "Thiếu thông tin học sinh" });

    const student = await UserModel.findById(studentId).lean<IUserDocument>();
    if (!student)
      return res.status(404).json({ message: "Không tìm thấy học sinh" });

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
        grade: student.schoolYear,
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
  } catch (err: any) {
    console.error("⚠️ addStudentToClass error:", err.message);
    return res
      .status(500)
      .json({ message: "Thêm học sinh thất bại", error: err.message });
  }
};

/* ==================================
 * 👩‍🏫 GÁN GIÁO VIÊN CHO LỚP
 * ================================== */
export const assignTeacher = async (req: Request, res: Response) => {
  try {
    const { classCode } = req.params;
    const { teacherId } = req.body;

    if (!teacherId)
      return res.status(400).json({ message: "teacherId là bắt buộc" });

    const teacher = await TeacherModel.findById(teacherId);
    if (!teacher)
      return res.status(404).json({ message: "Không tìm thấy giáo viên" });

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
        grade: schoolYear,
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
      if (!cls.schoolYear) cls.schoolYear = schoolYear;
      if (!cls.classLetter) cls.classLetter = classLetter;
      if (!cls.major) cls.major = major;
      await cls.save();
    }

    if (cls.studentIds?.length > 0) {
      await UserModel.updateMany(
        { _id: { $in: cls.studentIds } },
        { $set: { teacherId: teacherObjectId } },
      );
    }

    return res.status(200).json(cls);
  } catch (err: any) {
    console.error("⚠️ assignTeacher error:", err.message);
    return res
      .status(500)
      .json({ message: "Gán giáo viên thất bại", error: err.message });
  }
};
