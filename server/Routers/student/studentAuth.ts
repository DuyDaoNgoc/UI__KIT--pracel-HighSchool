import { Router, Request, Response } from "express";
import User from "../../models/User";
import { IUser } from "../../types/user";
import { Document } from "mongoose";
import {
  verifyToken,
  checkRole,
  AuthRequest,
} from "../../middleware/authMiddleware";
import ClassModel from "../../models/Class";
import { generateClassCode } from "../../helpers/classCode";

// Tạo kiểu cho Document Mongoose
type IUserDocument = IUser & Document;

const router = Router();

/**
 * 🏫 DELETE: Xóa học sinh
 * Route: DELETE /api/admin/students/:studentId
 * Middleware: verifyToken, checkRole(admin)
 */
router.delete(
  "/:studentId",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    const { studentId } = req.params;

    try {
      const student = await User.findOneAndDelete({ studentId });
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Học sinh không tồn tại" });
      }

      // Remove khỏi ClassModel
      await ClassModel.updateMany(
        { studentIds: student._id },
        { $pull: { studentIds: student._id } },
      );

      return res
        .status(200)
        .json({ success: true, message: "Đã xóa học sinh" });
    } catch (err: any) {
      console.error("students/delete error:", err);
      return res.status(500).json({ success: false, message: "Xóa thất bại" });
    }
  },
);

/**
 * 🏫 POST: Tạo học sinh mới
 * Route: POST /api/admin/students/create
 */
router.post(
  "/create",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const admin = authReq.user;

    if (!admin) return res.status(401).json({ message: "Unauthorized" });

    const {
      name,
      dob,
      address,
      residence,
      phone,
      grade,
      classLetter,
      schoolYear,
      major,
      studentId: frontendStudentId,
    } = req.body;

    if (!name || !grade || !classLetter || !schoolYear || !major) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    try {
      let studentId = frontendStudentId;
      if (!studentId) {
        const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
        studentId = `${grade}${classLetter}${randomPart}`;
      }

      const classCode = generateClassCode(grade, classLetter, major);

      const existing = await User.findOne({ studentId });
      if (existing)
        return res.status(400).json({ message: "Mã học sinh đã tồn tại" });

      const student: IUserDocument = new User({
        username: name,
        dob,
        address,
        residence,
        phone,
        teacherId: "",
        grade,
        class: classLetter,
        schoolYear,
        studentId,
        role: "student",
        major,
        classCode,
        createdAt: new Date(),
      });

      await student.save();

      // Upsert class
      await ClassModel.findOneAndUpdate(
        { classCode },
        {
          $setOnInsert: {
            grade,
            classLetter,
            major,
            teacherId: null,
            teacherName: "",
          },
          $addToSet: { studentIds: student._id },
        },
        { upsert: true, new: true },
      );

      return res
        .status(201)
        .json({ message: "Tạo học sinh thành công", studentId, classCode });
    } catch (err: any) {
      console.error("students/create error:", err);
      return res.status(500).json({ message: "Không thể tạo học sinh" });
    }
  },
);

/**
 * 🏫 GET: Lấy danh sách học sinh theo lớp
 * Route: GET /api/admin/students/:classCode
 */
router.get(
  "/:classCode",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    const { classCode } = req.params;

    try {
      const students = await User.find({ classCode, role: "student" });
      return res.status(200).json({ success: true, data: students });
    } catch (err: any) {
      console.error("students/fetch error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Không thể lấy danh sách học sinh" });
    }
  },
);

/**
 * 🏫 PUT: Cập nhật thông tin học sinh
 * Route: PUT /api/admin/students/:studentId
 */
router.put(
  "/:studentId",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    const { studentId } = req.params;
    const updateData = req.body;

    try {
      const student = await User.findOneAndUpdate({ studentId }, updateData, {
        new: true,
      });

      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Học sinh không tồn tại" });
      }

      return res.status(200).json({ success: true, data: student });
    } catch (err: any) {
      console.error("students/update error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Cập nhật thất bại" });
    }
  },
);

export default router;
