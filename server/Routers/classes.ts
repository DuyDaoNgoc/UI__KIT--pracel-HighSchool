// server/Routers/classes.ts
import { Router, Request, Response } from "express";
import ClassModel, { IClass } from "../models/Class";
import { verifyToken, checkRole } from "../middleware/authMiddleware";

const router = Router();

/**
 * GET all classes
 */
router.get(
  "/",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const classes = await ClassModel.find();
      return res.status(200).json({ success: true, data: classes });
    } catch (err) {
      console.error("⚠️ fetch classes error:", err);
      return res.status(500).json({
        success: false,
        message: "Không thể lấy danh sách lớp",
      });
    }
  }
);

/**
 * CREATE class (hoặc lấy nếu đã tồn tại)
 */
router.post(
  "/create",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { grade, classLetter, major, classCode } = req.body;

      if (!grade || !classLetter || !classCode) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin lớp",
        });
      }

      let cls = await ClassModel.findOne({ classCode });
      if (!cls) {
        cls = new ClassModel({
          grade,
          classLetter,
          major: major ?? "",
          classCode,
          teacherName: "",
          studentIds: [],
        });
        await cls.save();
      }

      return res.status(201).json({ success: true, data: cls });
    } catch (err) {
      console.error("⚠️ create class error:", err);
      return res.status(500).json({
        success: false,
        message: "Không thể tạo lớp",
      });
    }
  }
);

/**
 * ASSIGN teacher to class (tự tạo lớp nếu chưa tồn tại)
 */
router.post(
  "/:classCode/assign-teacher",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { classCode } = req.params;
      const { teacherName, grade, classLetter, major } = req.body;

      if (!teacherName)
        return res.status(400).json({
          success: false,
          message: "Thiếu tên giáo viên",
        });

      let cls = await ClassModel.findOne({ classCode });

      if (!cls) {
        if (!grade || !classLetter) {
          return res.status(400).json({
            success: false,
            message: "Thiếu grade hoặc classLetter để tạo lớp",
          });
        }
        cls = new ClassModel({
          grade,
          classLetter,
          major: major ?? "",
          classCode,
          teacherName,
          studentIds: [],
        });
        await cls.save();
      } else {
        cls.teacherName = teacherName;
        await cls.save();
      }

      return res.status(200).json({ success: true, data: cls });
    } catch (err) {
      console.error("⚠️ assign teacher error:", err);
      return res.status(500).json({
        success: false,
        message: "Gán giáo viên thất bại",
      });
    }
  }
);

/**
 * ADD student to class (tự tạo lớp nếu chưa tồn tại)
 */
router.post(
  "/:classCode/add-student",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { classCode } = req.params;
      const { studentId, grade, classLetter, major } = req.body;

      if (!studentId)
        return res.status(400).json({
          success: false,
          message: "Thiếu studentId",
        });

      let cls = await ClassModel.findOne({ classCode });

      if (!cls) {
        if (!grade || !classLetter) {
          return res.status(400).json({
            success: false,
            message: "Thiếu grade hoặc classLetter để tạo lớp",
          });
        }
        cls = new ClassModel({
          grade,
          classLetter,
          major: major ?? "",
          classCode,
          teacherName: "",
          studentIds: [studentId],
        });
        await cls.save();
      } else {
        // Thêm học sinh, tránh trùng lặp
        cls.studentIds = cls.studentIds || [];
        if (!cls.studentIds.includes(studentId)) {
          cls.studentIds.push(studentId);
          await cls.save();
        }
      }

      return res.status(200).json({ success: true, data: cls });
    } catch (err) {
      console.error("⚠️ add student error:", err);
      return res.status(500).json({
        success: false,
        message: "Thêm học sinh thất bại",
      });
    }
  }
);

export default router;
