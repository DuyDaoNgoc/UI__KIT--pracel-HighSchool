// server/controllers/admin/createStudent.ts
import { Request, Response } from "express";
import { connectDB } from "../../../configs/db";
import ClassModel from "../../../models/Class";
import mongoose from "mongoose";

export const createStudent = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const students = db.collection("students");

    console.log("📥 [createStudent] Received body:", req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không nhận được dữ liệu từ client.",
        data: null,
      });
    }

    const {
      studentId,
      name,
      dob,
      gender,
      address,
      residence,
      phone,
      grade,
      classLetter,
      schoolYear,
      major,
      classCode,
    } = req.body;

    if (!studentId || !name || !dob || !grade || !classLetter || !schoolYear) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin bắt buộc (studentId, name, dob, grade, classLetter, schoolYear).",
        data: req.body,
      });
    }

    const parsedDob = new Date(dob);
    if (isNaN(parsedDob.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Ngày sinh không hợp lệ. Vui lòng dùng định dạng YYYY-MM-DD.",
        data: { dob },
      });
    }

    const existingStudent = await students.findOne({ studentId });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: `Mã học sinh ${studentId} đã tồn tại. Vui lòng kiểm tra lại.`,
      });
    }

    const safeClassCode =
      classCode ??
      `${grade}${classLetter}${(major || "")
        .split(/\s+/)
        .map((w: string) => w[0]?.toUpperCase() || "")
        .join("")}`;

    const newStudent = {
      studentId: String(studentId),
      name: String(name),
      username: String(name),
      role: "student",
      dob: parsedDob,
      gender: String(gender ?? ""),
      address: address ?? "",
      residence: residence ?? "",
      phone: phone ?? "",
      grade: String(grade),
      classLetter: String(classLetter),
      schoolYear: String(schoolYear),
      major: major ?? "",
      classCode: String(safeClassCode),
      teacherId: "",
      parentId: "",
      avatar: "",
      createdAt: new Date(),
    };

    console.log("🚀 [createStudent] Insert student:", newStudent);

    // Insert student
    const result = await students.insertOne(newStudent);

    // ===== THÊM PHẦN UPDATE CLASS =====
    const className = `${grade}${classLetter} - ${major || ""} (${schoolYear})`;
    const cls = await ClassModel.findOne({ classCode: safeClassCode });

    if (!cls) {
      // Tạo mới class nếu chưa có
      await ClassModel.create({
        grade,
        classLetter,
        schoolYear,
        major: major ?? "",
        classCode: safeClassCode,
        teacherId: null,
        teacherName: "",
        studentIds: [new mongoose.Types.ObjectId(result.insertedId)],
        className,
      });
    } else {
      // Thêm student vào class nếu chưa có
      const studentObjectId = new mongoose.Types.ObjectId(result.insertedId);
      if (!cls.studentIds.some((id) => id.equals(studentObjectId))) {
        cls.studentIds.push(studentObjectId);
        await cls.save();
      }
    }
    // ===== END UPDATE CLASS =====

    const allStudents = await students.find().sort({ createdAt: -1 }).toArray();

    return res.status(201).json({
      success: true,
      message: "Học sinh đã được tạo thành công.",
      data: {
        student: { ...newStudent, _id: result.insertedId },
        students: allStudents,
      },
    });
  } catch (error: any) {
    console.error("❌ [createStudent] Unexpected error:", error);

    if (error?.errInfo?.details?.schemaRulesNotSatisfied) {
      console.error(
        "📋 Schema rules not satisfied:",
        JSON.stringify(error.errInfo.details.schemaRulesNotSatisfied, null, 2)
      );
    }

    return res.status(500).json({
      success: false,
      message: "Không thể tạo học sinh. Vui lòng thử lại sau.",
      errorDetail: {
        name: error?.name ?? null,
        message: error?.message ?? String(error),
        stack: error?.stack ?? null,
        details: error?.errInfo?.details ?? null,
      },
    });
  }
};

export default createStudent;
