// server/controllers/admin/createStudent.ts
import { Request, Response } from "express";
import { connectDB } from "../../../configs/db";
import { ObjectId } from "mongodb"; // <<< THÊM DÒNG NÀY

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

    // Check các thông tin bắt buộc
    if (!studentId || !name || !dob || !grade || !classLetter || !schoolYear) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin bắt buộc (studentId, name, dob, grade, classLetter, schoolYear).",
        data: req.body,
      });
    }

    // Chuyển dob thành Date object
    const parsedDob = new Date(dob);
    if (isNaN(parsedDob.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Ngày sinh không hợp lệ. Vui lòng dùng định dạng YYYY-MM-DD.",
        data: { dob },
      });
    }

    // Check unique studentId
    const existingStudent = await students.findOne({ studentId });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: `Mã học sinh ${studentId} đã tồn tại. Vui lòng kiểm tra lại.`,
      });
    }

    // Tạo classCode an toàn nếu chưa có (🔥 Chỉnh sửa duy nhất ở đây)
    const safeClassCode =
      classCode ??
      `${String(grade)}${String(classLetter)}-${(major ?? "")
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
      address: String(address ?? ""),
      residence: String(residence ?? ""),
      phone: String(phone ?? ""),
      grade: String(grade),
      classLetter: String(classLetter),
      schoolYear: String(schoolYear),
      major: String(major ?? ""),
      classCode: String(safeClassCode),
      teacherId: "",
      parentId: "",
      avatar: "",
      createdAt: new Date(),
    };

    console.log("🚀 [createStudent] Insert student:", newStudent);

    // Insert student
    const result = await students.insertOne(newStudent);

    // 🔥 Thêm học sinh vào lớp tương ứng
    try {
      const classes = db.collection("classes");

      const classDoc = await classes.findOne({
        classCode: newStudent.classCode,
      });

      if (classDoc) {
        await classes.updateOne(
          { classCode: newStudent.classCode },
          {
            $addToSet: {
              // ❗SỬA ĐÚNG FIELD THEO MODEL
              studentIds: new ObjectId(result.insertedId),
            },
          },
        );
      } else {
        console.warn("⚠️ Không tìm thấy lớp:", newStudent.classCode);
      }
    } catch (err) {
      console.error("❌ Lỗi khi thêm học sinh vào lớp:", err);
    }

    // Lấy danh sách tất cả students mới nhất
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
        JSON.stringify(error.errInfo.details.schemaRulesNotSatisfied, null, 2),
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
