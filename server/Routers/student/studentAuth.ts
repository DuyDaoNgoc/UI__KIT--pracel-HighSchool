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
 * 🏫 GET: Lấy danh sách tất cả học sinh
 * Route: GET /api/admin/students
 */
router.get(
  "/",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      // ✅ Chỉ select những field cần thiết và đổi username thành name
      const students = await User.find({ role: "student" })
        .sort({ createdAt: -1 })
        .select(
          "_id studentId username dob address residence phone grade class major schoolYear",
        );

      // Map username -> name để frontend nhận đúng
      const mappedStudents = students.map((s) => ({
        _id: s._id,
        studentId: s.studentId,
        name: s.username, // ✅ đây là điểm quan trọng
        dob: s.dob,
        address: s.address,
        residence: s.residence,
        phone: s.phone,
        grade: s.grade,
        classLetter: s.class,
        major: s.major,
        schoolYear: s.schoolYear,
      }));

      return res.status(200).json({ success: true, data: mappedStudents });
    } catch (err: any) {
      console.error("students/fetch-all error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Không thể lấy danh sách học sinh" });
    }
  },
);

/**
 * 🏫 DELETE: Xóa học sinh
 * Route: DELETE /api/admin/students/delete/:studentId
 */
router.delete(
  "/delete/:studentId",
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
        username: name, // ✅ lưu tên vào username
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

      // Trả dữ liệu đầy đủ học sinh vừa tạo
      return res.status(201).json({
        success: true,
        data: {
          _id: student._id,
          studentId: student.studentId,
          name: student.username,
          dob: student.dob,
          address: student.address,
          residence: student.residence,
          phone: student.phone,
          grade: student.grade,
          classLetter: student.class,
          major: student.major,
          schoolYear: student.schoolYear,
          classCode: student.classCode,
        },
      });
    } catch (err: any) {
      console.error("students/create error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Không thể tạo học sinh" });
    }
  },
);

/**
 * 🏫 GET: Lấy danh sách học sinh theo lớp
 * Route: GET /api/admin/students/by-class/:classCode
 */
router.get(
  "/by-class/:classCode",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    const { classCode } = req.params;

    try {
      const students = await User.find({ classCode, role: "student" });
      const mappedStudents = students.map((s) => ({
        _id: s._id,
        studentId: s.studentId,
        name: s.username,
        dob: s.dob,
        address: s.address,
        residence: s.residence,
        phone: s.phone,
        grade: s.grade,
        classLetter: s.class,
        major: s.major,
        schoolYear: s.schoolYear,
        classCode: s.classCode,
      }));

      return res.status(200).json({ success: true, data: mappedStudents });
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
 * Route: PUT /api/admin/students/update/:studentId
 */
router.put(
  "/update/:studentId",
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

      return res.status(200).json({
        success: true,
        data: {
          _id: student._id,
          studentId: student.studentId,
          name: student.username,
          dob: student.dob,
          address: student.address,
          residence: student.residence,
          phone: student.phone,
          grade: student.grade,
          classLetter: student.class,
          major: student.major,
          schoolYear: student.schoolYear,
          classCode: student.classCode,
        },
      });
    } catch (err: any) {
      console.error("students/update error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Cập nhật thất bại" });
    }
  },
);

export default router;
