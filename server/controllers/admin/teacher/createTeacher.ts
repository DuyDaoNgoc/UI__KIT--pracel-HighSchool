import { Request, Response } from "express";
import mongoose from "mongoose";
import TeacherModel, {
  IAssignedClass,
  ITeacher,
} from "../../../models/teacherModel";
import ClassModel from "../../../models/Class";

// Auto sinh teacherId GVxxxxx
const generateTeacherId = async (): Promise<string> => {
  const lastTeacher = await TeacherModel.findOne({}, { teacherId: 1 })
    .sort({ teacherId: -1 }) // dùng -1 để lấy cuối cùng
    .lean();
  if (!lastTeacher?.teacherId) return "GV00001";
  const lastNumber = parseInt(lastTeacher.teacherId.replace("GV", ""), 10);
  return "GV" + String(lastNumber + 1).padStart(5, "0");
};

// Chuẩn hóa array
const normalizeArray = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [val];
};

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const {
      teacherId,
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

    if (!name || !dob || !gender) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (name, dob, gender)",
      });
    }

    const finalTeacherId = teacherId?.trim() || (await generateTeacherId());

    const query: any = { $or: [{ teacherId: finalTeacherId }] };
    if (email) query.$or.push({ email: email.trim().toLowerCase() });
    if (await TeacherModel.findOne(query)) {
      return res.status(409).json({
        success: false,
        message: "TeacherId hoặc Email đã tồn tại",
      });
    }

    let assignedClass: IAssignedClass | undefined;
    let finalAssignedClassCode = "";
    if (assignedClassCode?.trim()) {
      finalAssignedClassCode = assignedClassCode.trim();
      const existingClass = await TeacherModel.findOne({
        assignedClassCode: finalAssignedClassCode,
      });
      if (existingClass) {
        return res.status(409).json({
          success: false,
          message: `Lớp ${finalAssignedClassCode} đã được gán cho giáo viên khác`,
        });
      }
      assignedClass = {
        grade: "",
        classLetter: "",
        major: "",
        schoolYear: "",
        classCode: finalAssignedClassCode,
      };
    }

    const teacherData: ITeacher = new TeacherModel({
      teacherId: finalTeacherId,
      name: name.trim(),
      dob: new Date(dob),
      gender,
      phone: phone || "",
      address: address || "",
      majors: normalizeArray(majors),
      subjectClasses: normalizeArray(subjectClasses),
      email: email?.trim().toLowerCase() || "",
      degree: degree || "",
      educationLevel: educationLevel || "",
      certificates: normalizeArray(certificates),
      research: research || "",
      subject: normalizeArray(subject),
      avatar: avatar || "",
      assignedClassCode: finalAssignedClassCode || null,
      assignedClass,
    });

    await teacherData.save();

    // ===== THÊM PHẦN UPDATE CLASS =====
    if (finalAssignedClassCode) {
      let cls = await ClassModel.findOne({ classCode: finalAssignedClassCode });
      if (!cls) {
        // Nếu class chưa tồn tại, tạo mới
        cls = await ClassModel.create({
          grade: "",
          classLetter: "",
          schoolYear: "",
          major: "",
          classCode: finalAssignedClassCode,
          teacherId: teacherData._id,
          teacherName: teacherData.name,
          studentIds: [],
          className: "",
        });
      } else {
        // Nếu class đã có, cập nhật teacher
        cls.teacherId = teacherData._id as mongoose.Types.ObjectId;
        cls.teacherName = teacherData.name;
        await cls.save();
      }
    }
    // ===== END UPDATE CLASS =====

    return res.status(201).json({
      success: true,
      message: "Thêm giáo viên thành công",
      teacher: teacherData,
    });
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern?.["assignedClassCode"]) {
      return res.status(400).json({
        success: false,
        message: "Mã lớp đã tồn tại, vui lòng chọn lớp khác",
      });
    }

    console.error("❌ Lỗi tạo giáo viên:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      errorDetail: error?.message ?? String(error),
    });
  }
};

export default createTeacher;
