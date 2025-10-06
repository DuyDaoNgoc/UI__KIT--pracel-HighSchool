// server/Routers/classes.ts
import { Router, Request, Response } from "express";
import ClassModel, { IClass } from "../../models/Class";
import { verifyToken, checkRole } from "../../middleware/authMiddleware";

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
      const { schoolYear, classLetter, major, classCode } = req.body;

      if (!schoolYear || !classLetter || !classCode) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin lớp",
        });
      }

      // ✅ Kiểm tra tồn tại class (theo unique index)
      let cls = await ClassModel.findOne({ classCode, schoolYear, major });

      if (!cls) {
        cls = new ClassModel({
          schoolYear,
          classLetter,
          major: major ?? "",
          classCode,
          teacherName: "",
          studentIds: [],
        });
        await cls.save();
      }

      return res.status(201).json({ success: true, data: cls });
    } catch (err: any) {
      console.error("⚠️ create class error:", err);
      if (err.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Lớp này đã tồn tại (trùng classCode, major, schoolYear)",
        });
      }
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
      const { teacherName, schoolYear, classLetter, major } = req.body;

      if (!teacherName) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tên giáo viên",
        });
      }

      let cls = await ClassModel.findOne({ classCode, schoolYear, major });

      if (!cls) {
        if (!schoolYear || !classLetter) {
          return res.status(400).json({
            success: false,
            message: "Thiếu schoolYear hoặc classLetter để tạo lớp",
          });
        }
        cls = new ClassModel({
          schoolYear,
          classLetter,
          major: major ?? "",
          classCode,
          teacherName,
          studentIds: [],
        });
      } else {
        cls.teacherName = teacherName;
      }

      await cls.save();
      return res.status(200).json({ success: true, data: cls });
    } catch (err: any) {
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
      const { studentId, schoolYear, classLetter, major } = req.body;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu studentId",
        });
      }

      let cls = await ClassModel.findOne({ classCode, schoolYear, major });

      if (!cls) {
        if (!schoolYear || !classLetter) {
          return res.status(400).json({
            success: false,
            message: "Thiếu schoolYear hoặc classLetter để tạo lớp",
          });
        }
        cls = new ClassModel({
          schoolYear,
          classLetter,
          major: major ?? "",
          classCode,
          teacherName: "",
          studentIds: [studentId],
        });
      } else {
        cls.studentIds = cls.studentIds || [];
        const exists = cls.studentIds.some(
          (id) => id.toString() === studentId.toString()
        );
        if (!exists) cls.studentIds.push(studentId);
      }

      await cls.save();
      return res.status(200).json({ success: true, data: cls });
    } catch (err: any) {
      console.error("⚠️ add student error:", err);
      return res.status(500).json({
        success: false,
        message: "Thêm học sinh thất bại",
      });
    }
  }
);

export default router;
