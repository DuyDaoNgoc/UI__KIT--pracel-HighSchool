// server/controllers/admin/createTeacher.ts
import { Request, Response } from "express";
import { connectDB } from "../configs/db";

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const teachers = db.collection("teachers");

    console.log("📥 [createTeacher] Received body:", req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không nhận được dữ liệu từ client.",
        data: null,
      });
    }

    const {
      teacherId,
      name,
      dob,
      phone,
      major,
      subject,
      address,
      residence,
      email,
      classAssigned, // optional: các lớp được phân công
    } = req.body;

    // Validate bắt buộc
    if (!teacherId || !name || !dob || !phone || !major || !subject) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin bắt buộc (teacherId, name, dob, phone, major, subject).",
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

    const existingTeacher = await teachers.findOne({ teacherId });
    if (existingTeacher) {
      return res.status(409).json({
        success: false,
        message: "Mã giáo viên đã tồn tại. Vui lòng kiểm tra lại.",
      });
    }

    const newTeacher = {
      teacherId: String(teacherId),
      name: String(name),
      username: String(name),
      role: "teacher",
      dob: parsedDob, // Date object
      phone: String(phone),
      major: String(major),
      subject: String(subject),
      address: address ?? "",
      residence: residence ?? "",
      email: email ?? "",
      classAssigned: classAssigned ?? [], // mảng lớp được phân công
      avatar: "",
      createdAt: new Date(), // Date object
    };

    console.log("🚀 [createTeacher] Insert teacher:", newTeacher);

    const result = await teachers.insertOne(newTeacher);
    const allTeachers = await teachers.find().sort({ createdAt: -1 }).toArray();

    return res.status(201).json({
      success: true,
      message: "Giáo viên đã được tạo thành công.",
      data: {
        teacher: { ...newTeacher, _id: result.insertedId },
        teachers: allTeachers,
      },
    });
  } catch (error: any) {
    console.error("❌ [createTeacher] Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tạo giáo viên. Vui lòng thử lại sau.",
      errorDetail: {
        name: error?.name ?? null,
        message: error?.message ?? String(error),
        stack: error?.stack ?? null,
        details: error?.errInfo?.details ?? null,
      },
    });
  }
};
// ===== Quản lý học sinh =====
