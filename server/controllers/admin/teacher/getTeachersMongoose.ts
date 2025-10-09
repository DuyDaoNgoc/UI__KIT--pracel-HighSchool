// server/controllers/admin/teacher/getTeachersMongoose.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import TeacherModel, {
  ITeacher,
  IAssignedClass,
} from "../../../models/teacherModel";

// Interface trả về cho client
export interface ICreatedTeacher {
  _id: string;
  name: string;
  dob?: string;
  gender?: "Nam" | "Nữ" | "other";
  phone?: string;
  address?: string;
  majors: string[];
  subjectClasses?: string[];
  assignedClass?: IAssignedClass | null;
  assignedClassCode?: string;
  email?: string;
  degree?: string;
  educationLevel?: string;
  certificates?: string[];
  research?: string;
  subject?: string[];
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getTeachersMongoose = async (req: Request, res: Response) => {
  try {
    const teachers: ITeacher[] = await TeacherModel.find();

    const formattedTeachers: ICreatedTeacher[] = teachers.map((t) => {
      const _id =
        t._id instanceof mongoose.Types.ObjectId
          ? t._id.toString()
          : String(t._id);

      return {
        _id,
        name: t.name,
        dob: t.dob ? new Date(t.dob).toISOString().split("T")[0] : undefined,
        gender: t.gender,
        phone: t.phone ?? undefined,
        address: t.address ?? undefined,
        majors: Array.isArray(t.majors) ? t.majors : [],
        subjectClasses: Array.isArray(t.subjectClasses) ? t.subjectClasses : [],
        assignedClass: t.assignedClass ?? null,
        assignedClassCode: t.assignedClassCode ?? undefined,
        email: t.email ?? undefined,
        degree: t.degree ?? undefined,
        educationLevel: t.educationLevel ?? undefined,
        certificates: Array.isArray(t.certificates) ? t.certificates : [],
        research: t.research ?? undefined,
        subject: t.subject
          ? Array.isArray(t.subject)
            ? t.subject
            : [t.subject]
          : [],
        avatar: t.avatar ?? undefined,
        createdAt: t.createdAt
          ? new Date(t.createdAt).toISOString()
          : undefined,
        updatedAt: t.updatedAt
          ? new Date(t.updatedAt).toISOString()
          : undefined,
      };
    });

    return res.json({
      success: true,
      message: "Lấy danh sách giáo viên thành công",
      teachers: formattedTeachers, // 👈 đổi từ data -> teachers
    });
  } catch (error: any) {
    console.error("❌ [getTeachersMongoose] error:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách giáo viên",
      errorDetail: error?.message ?? String(error),
    });
  }
};

export default getTeachersMongoose;
