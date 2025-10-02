import { Request, Response } from "express";
import TeacherModel, { IAssignedClass } from "../../../models/teacherModel";

export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload: any = { ...req.body };

    delete payload._id;
    delete payload.teacherId;

    // Convert dob
    if (payload.dob && !isNaN(Date.parse(payload.dob))) {
      payload.dob = new Date(payload.dob);
    }

    // Handle assignedClass
    if (payload.assignedClassCode?.trim()) {
      const classCode = payload.assignedClassCode.trim();
      // Check lớp đã được gán chưa
      const existed = await TeacherModel.findOne({
        assignedClassCode: classCode,
        _id: { $ne: id },
      });
      if (existed) {
        return res.status(409).json({
          success: false,
          message: `Lớp ${classCode} đã được gán cho giáo viên khác`,
        });
      }

      payload.assignedClass = {
        grade: "",
        classLetter: "",
        major: "",
        schoolYear: "",
        classCode,
      } as IAssignedClass;
    } else {
      payload.assignedClass = null;
      payload.assignedClassCode = null;
    }

    const updated = await TeacherModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giáo viên",
      });

    return res.json({
      success: true,
      message: "Cập nhật giáo viên thành công",
      data: updated,
    });
  } catch (err: any) {
    console.error("❌ [updateTeacher] error:", err);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật giáo viên",
      errorDetail: err?.message ?? String(err),
    });
  }
};

export default updateTeacher;
