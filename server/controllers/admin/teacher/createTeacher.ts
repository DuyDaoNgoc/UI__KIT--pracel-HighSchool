import { Request, Response } from "express";
import TeacherModel, {
  IAssignedClass,
  ITeacher,
} from "../../../models/teacherModel";

// Auto sinh teacherId GVxxxxx
const generateTeacherId = async (): Promise<string> => {
  const lastTeacher = await TeacherModel.findOne({}, { teacherId: 1 })
    .sort({ teacherId: -1 })
    .lean();
  if (!lastTeacher?.teacherId) return "GV00001";
  const lastNumber = parseInt(lastTeacher.teacherId.replace("GV", ""), 10);
  return "GV" + String(lastNumber + 1).padStart(5, "0");
};

// Chuẩn hóa array từ string hoặc array
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

    // Validate bắt buộc
    if (!name || !dob || !gender) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (name, dob, gender)",
      });
    }

    const finalTeacherId = teacherId?.trim() || (await generateTeacherId());

    // Kiểm tra trùng teacherId / email
    const query: any = { $or: [{ teacherId: finalTeacherId }] };
    if (email) query.$or.push({ email: email.trim().toLowerCase() });
    if (await TeacherModel.findOne(query)) {
      return res.status(409).json({
        success: false,
        message: "TeacherId hoặc Email đã tồn tại",
      });
    }

    // Chuẩn bị assignedClass nếu có
    let assignedClass: IAssignedClass | undefined = undefined;
    let finalAssignedClassCode: string = "";

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

    // Tạo document, tất cả string luôn có giá trị
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
      assignedClassCode: finalAssignedClassCode,
      assignedClass,
    });

    await teacherData.save();

    return res.status(201).json({
      success: true,
      message: "Thêm giáo viên thành công",
      teacher: teacherData,
    });
  } catch (error: unknown) {
    const err = error as {
      code?: number;
      keyPattern?: any;
      keyValue?: any;
      message?: string;
    };

    // Handle duplicate key assignedClass.classCode
    if (
      err.code === 11000 &&
      err.keyPattern?.["assignedClass.classCode"] &&
      err.keyValue?.["assignedClass.classCode"]
    ) {
      return res.status(400).json({
        success: false,
        message:
          "assignedClass.classCode không hợp lệ hoặc đã tồn tại, bỏ classCode để tạo",
      });
    }

    console.error("❌ Lỗi tạo giáo viên:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      errorDetail: err?.message ?? String(err),
    });
  }
};

export default createTeacher;
