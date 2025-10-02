// server/controllers/admin/teacher/teachersController.ts
import { Request, Response } from "express";
import TeacherModel, { ITeacher } from "../../../models/teacherModel";

// 🔹 Hàm sinh mã giáo viên tự động: GV00001, GV00002,...
const generateTeacherId = async (): Promise<string> => {
  const lastTeacher = await TeacherModel.findOne({}, { teacherId: 1 })
    .sort({ teacherId: -1 })
    .lean();

  if (!lastTeacher?.teacherId) {
    return "GV00001";
  }

  const lastNumber = parseInt(lastTeacher.teacherId.replace("GV", ""), 10);
  const newNumber = lastNumber + 1;

  return "GV" + String(newNumber).padStart(5, "0");
};

// 🔹 Controller: Tạo giáo viên mới
export const createTeacher = async (req: Request, res: Response) => {
  try {
    const {
      teacherId, // 👈 cho phép truyền thủ công
      name,
      dob,
      gender,
      phone,
      address,
      majors,
      subjectClasses,
      assignedClassCode,
      email,
      degree,
      educationLevel,
      certificates,
      research,
      subject,
      avatar,
    } = req.body;

    // 1. Validate bắt buộc
    if (!name || !dob || !gender) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (name, dob, gender)",
      });
    }

    // 2. Xác định teacherId cuối cùng
    const finalTeacherId: string =
      teacherId && teacherId.trim() !== ""
        ? teacherId.trim()
        : await generateTeacherId();

    // 3. Kiểm tra trùng teacherId hoặc email
    const query: any = { $or: [{ teacherId: finalTeacherId }] };
    if (email) query.$or.push({ email: email.trim().toLowerCase() });

    const existed = await TeacherModel.findOne(query);
    if (existed) {
      return res.status(409).json({
        success: false,
        message: "TeacherId hoặc Email đã tồn tại",
      });
    }

    // 4. Chuẩn hoá array
    const normalizeArray = (val: any) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        return val
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== "");
      }
      return [val];
    };

    // 5. Tạo mới giáo viên
    const newTeacher: ITeacher = new TeacherModel({
      teacherId: finalTeacherId, // ✅ auto GVxxxxx nếu không truyền
      name: name.trim(),
      dob: new Date(dob),
      gender,
      phone,
      address,
      majors: normalizeArray(majors),
      subjectClasses: normalizeArray(subjectClasses),
      assignedClassCode,
      email: email?.trim().toLowerCase(),
      degree,
      educationLevel,
      certificates: normalizeArray(certificates),
      research,
      subject,
      avatar,
    });

    await newTeacher.save();

    return res.status(201).json({
      success: true,
      message: "Thêm giáo viên thành công",
      teacher: newTeacher,
    });
  } catch (err: any) {
    console.error("❌ Lỗi tạo giáo viên:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: err.message,
    });
  }
};
