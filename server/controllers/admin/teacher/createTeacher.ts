import { Request, Response } from "express";
import mongoose from "mongoose";
import TeacherModel, {
  IAssignedClass,
  ITeacher,
} from "../../../models/teacherModel";
import ClassModel from "../../../models/Class";

/* ====================================================
   🔹 HÀM: generateTeacherId()
   ----------------------------------------------------
   - Sinh teacherId tự động dạng GV00001, GV00002, ...
   - Dò document cuối cùng (theo teacherId) và +1.
   - Không tạo trùng vì có unique index + kiểm tra trước khi lưu.
===================================================== */
const generateTeacherId = async (): Promise<string> => {
  const lastTeacher = await TeacherModel.findOne({}, { teacherId: 1 })
    .sort({ teacherId: -1 })
    .lean();
  if (!lastTeacher?.teacherId) return "GV00001";
  const lastNumber = parseInt(lastTeacher.teacherId.replace("GV", ""), 10);
  return "GV" + String(lastNumber + 1).padStart(5, "0");
};

/* ====================================================
   🔹 HÀM: normalizeArray()
   ----------------------------------------------------
   - Đảm bảo input (string hoặc mảng) luôn trả về string[].
   - Hỗ trợ nhập “Toán, Lý, Hóa” => ["Toán", "Lý", "Hóa"].
===================================================== */
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

/* ====================================================
   🔹 API: createTeacher()
   ----------------------------------------------------
   - Tạo giáo viên mới, tự sinh teacherId, kiểm tra trùng.
   - Validate dữ liệu cơ bản: name, dob, gender.
   - Kiểm tra trùng email, assignedClassCode.
   - Cập nhật ClassModel nếu có assignedClassCode.
===================================================== */
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

    // 🔸 Kiểm tra trường bắt buộc
    if (!name || !dob || !gender) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc (name, dob, gender)",
      });
    }

    // 🔸 Sinh teacherId và kiểm tra trùng
    let finalTeacherId = teacherId?.trim() || (await generateTeacherId());
    let duplicateTeacher = await TeacherModel.findOne({
      $or: [
        { teacherId: finalTeacherId },
        { email: email?.trim().toLowerCase() || null },
      ],
    });

    // 🔁 Nếu bị trùng => tăng tiếp GVxxxxx
    while (duplicateTeacher) {
      const lastNumber = parseInt(finalTeacherId.replace("GV", ""), 10);
      finalTeacherId = "GV" + String(lastNumber + 1).padStart(5, "0");
      duplicateTeacher = await TeacherModel.findOne({
        teacherId: finalTeacherId,
      });
    }

    // 🔸 Kiểm tra trùng assignedClassCode (nếu có)
    let assignedClass: IAssignedClass | undefined;
    let finalAssignedClassCode: string | undefined = undefined;

    if (assignedClassCode?.trim()) {
      finalAssignedClassCode = assignedClassCode.trim();

      const existing = await TeacherModel.findOne({
        assignedClassCode: finalAssignedClassCode,
      });
      if (existing) {
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

    // 🔸 Chuẩn hóa dữ liệu để khớp schema
    const teacherData: ITeacher = new TeacherModel({
      teacherId: finalTeacherId,
      name: name.trim(),
      dob: new Date(dob),
      gender,
      phone: phone || "",
      address: address || "",
      majors: normalizeArray(majors),
      subjectClasses: normalizeArray(subjectClasses),
      email: email?.trim().toLowerCase() || undefined, // rỗng => undefined để không bị duplicate key
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

    // 🔸 Nếu có lớp chủ nhiệm => cập nhật ClassModel
    if (finalAssignedClassCode) {
      let cls = await ClassModel.findOne({ classCode: finalAssignedClassCode });
      if (!cls) {
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
        cls.teacherId = teacherData._id as mongoose.Types.ObjectId;
        cls.teacherName = teacherData.name;
        await cls.save();
      }
    }

    // ✅ Thành công
    return res.status(201).json({
      success: true,
      message: "Thêm giáo viên thành công",
      teacher: teacherData,
    });
  } catch (error: any) {
    console.error("❌ Lỗi tạo giáo viên:", error);
    if (error?.code === 11000) {
      // Xử lý lỗi duplicate key (index unique)
      return res.status(409).json({
        success: false,
        message: `Giá trị trùng lặp: ${JSON.stringify(error.keyValue)}`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      errorDetail: error?.message ?? String(error),
    });
  }
};

export default createTeacher;
