// server/Routers/classes.ts
import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import ClassModel, { IClass } from "../../models/Class";
import { verifyToken, checkRole } from "../../middleware/authMiddleware";

const router = Router();

/**
 * 🏫 GET all classes
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
 * 🏗️ CREATE class (hoặc lấy nếu đã tồn tại)
 */
router.post(
  "/create",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { schoolYear, classLetter, major } = req.body;

      if (!schoolYear || !classLetter || !major) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin lớp (schoolYear, classLetter, major)",
        });
      }

      // ✅ Viết tắt ngành (ví dụ: Công nghệ thông tin → CNTT)
      const majorAbbrev = major
        .split(/\s+/)
        .map((w: string) => w[0]?.toUpperCase() || "")
        .join("");
      const classCode = `${schoolYear}${classLetter}${majorAbbrev}`;

      // ✅ Kiểm tra lớp đã tồn tại chưa
      let cls = await ClassModel.findOne({ classCode, schoolYear, major });

      if (!cls) {
        cls = new ClassModel({
          schoolYear,
          classLetter,
          major,
          classCode,
          teacherId: null,
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
 * 👩‍🏫 ASSIGN teacher to class (chỉ gán nếu lớp đã tồn tại)
 */
router.post(
  "/:classCode/assign-teacher",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { classCode } = req.params;
      const { teacherName, teacherId, schoolYear, major } = req.body;

      if (!teacherName && !teacherId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin giáo viên (teacherName hoặc teacherId)",
        });
      }

      // ✅ Tìm lớp đã tồn tại
      const cls = await ClassModel.findOne({ classCode, schoolYear, major });

      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Lớp chưa tồn tại, không thể gán giáo viên",
        });
      }

      cls.teacherName = teacherName || "";
      cls.teacherId = teacherId ? new mongoose.Types.ObjectId(teacherId) : null;

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
 * 👨‍🎓 ADD student to class (chỉ thêm nếu lớp đã tồn tại)
 */
router.post(
  "/:classCode/add-student",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { classCode } = req.params;
      const { studentId, schoolYear, major } = req.body;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu studentId",
        });
      }

      // ✅ Tìm lớp đã tồn tại
      const cls = await ClassModel.findOne({ classCode, schoolYear, major });

      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Lớp chưa tồn tại, không thể thêm học sinh",
        });
      }

      const studentObjectId = new mongoose.Types.ObjectId(studentId);

      // ✅ Nếu học sinh chưa có trong lớp thì thêm
      if (!cls.studentIds.some((id) => id.equals(studentObjectId))) {
        cls.studentIds.push(studentObjectId);
        await cls.save();
      }

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
