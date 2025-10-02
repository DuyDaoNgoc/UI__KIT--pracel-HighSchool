// server/controllers/admin/createTeacher.ts
import { Request, Response } from "express";
import { connectDB } from "../../../configs/db";

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const teachers = db.collection("teachers");

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
      classAssigned = [], // lớp được phân công
    } = req.body;

    // ✅ Kiểm tra dữ liệu bắt buộc
    if (!teacherId || !name || !dob || !phone || !major || !subject) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin bắt buộc (teacherId, name, dob, phone, major, subject).",
      });
    }

    // ✅ Validate ngày sinh
    const parsedDob = new Date(dob);
    if (isNaN(parsedDob.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Ngày sinh không hợp lệ.",
      });
    }

    // ✅ Check trùng teacherId
    const existingTeacher = await teachers.findOne({
      teacherId: String(teacherId),
    });
    if (existingTeacher) {
      return res.status(409).json({
        success: false,
        message: "Mã giáo viên đã tồn tại.",
      });
    }

    // ✅ Tạo object giáo viên mới
    const newTeacher = {
      teacherId: String(teacherId),
      name: String(name),
      username: String(teacherId), // hợp lý hơn để login
      role: "teacher",
      dob: parsedDob,
      phone: String(phone),
      major: String(major),
      subject: String(subject),
      address: address ? String(address) : "",
      residence: residence ? String(residence) : "",
      email: email ? String(email) : "",
      classAssigned: Array.isArray(classAssigned) ? classAssigned : [],
      avatar: "",
      createdAt: new Date(),
    };

    // ✅ Lưu DB
    const result = await teachers.insertOne(newTeacher);

    // ✅ Lấy lại danh sách GV mới nhất
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
    console.error("❌ [createTeacher] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tạo giáo viên. Thử lại sau.",
      errorDetail: error?.message ?? String(error),
    });
  }
};
