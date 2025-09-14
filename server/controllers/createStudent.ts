// server/controllers/admin/createStudent.ts
import { Request, Response } from "express";
import { connectDB } from "../configs/db";

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
        message: "Mã học sinh đã tồn tại. Vui lòng kiểm tra lại.",
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
      dob: parsedDob, // ✅ Date object
      address: address ?? "",
      residence: residence ?? "",
      phone: phone ?? "",
      grade: String(grade),
      classLetter: String(classLetter),
      schoolYear: String(schoolYear),
      major: major ?? "",
      classCode: String(safeClassCode),
      teacherId: "", // ✅ string rỗng
      parentId: "", // ✅ string rỗng
      avatar: "",
      createdAt: new Date(), // ✅ Date object
    };

    console.log("🚀 [createStudent] Insert student:", newStudent);

    const result = await students.insertOne(newStudent);
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
