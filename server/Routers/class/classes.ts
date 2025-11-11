import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import ClassModel from "../../models/Class";
import { verifyToken, checkRole } from "../../middleware/authMiddleware";
import { assignTeacherToClass } from "../../controllers/admin/class/assignTeacherToClass";

const router = Router();

/**
 * 🏫 GET: Lấy toàn bộ lớp
 * Route: GET /api/classes
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
  },
);

/**
 * 🏫 POST: Tạo lớp mới
 * Route: POST /api/classes/create
 */
router.post(
  "/create",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { schoolYear, classLetter, major } = req.body;

      if (!schoolYear || !classLetter || !major) {
        console.warn("❌ Thiếu dữ liệu đầu vào:", req.body);
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin lớp (schoolYear, classLetter, major)",
        });
      }

      const majorAbbrev = major
        .split(/\s+/)
        .map((w: string) => w[0]?.toUpperCase() || "")
        .join("");
      const classCode = `${schoolYear}${classLetter}${majorAbbrev}`;

      const existed = await ClassModel.findOne({ classCode });
      if (existed) {
        return res.status(400).json({
          success: false,
          message: "Lớp đã tồn tại (trùng classCode)",
        });
      }

      const cls = new ClassModel({
        grade: schoolYear,
        schoolYear,
        classLetter,
        major,
        classCode,
        teacherId: null,
        teacherName: "",
        studentIds: [],
      });

      await cls.save();

      console.log("✅ Class created:", cls);
      return res.status(201).json({ success: true, data: cls });
    } catch (err: any) {
      console.error("⚠️ create class error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Không thể tạo lớp",
        error: err.message,
      });
    }
  },
);

/**
 * 👩‍🏫 GÁN GIÁO VIÊN CHO LỚP
 * Route: POST /api/classes/:classCode/assign-teacher
 */
router.post(
  "/:classCode/assign-teacher",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { classCode } = req.params;
      const { teacherName, teacherId } = req.body;

      if (!teacherName && !teacherId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin giáo viên (teacherName hoặc teacherId)",
        });
      }

      const cls = await ClassModel.findOne({ classCode });
      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Lớp không tồn tại",
        });
      }

      cls.teacherName = teacherName || "";
      cls.teacherId = teacherId ? new mongoose.Types.ObjectId(teacherId) : null;

      await cls.save();

      console.log("✅ Teacher assigned:", classCode);
      return res.status(200).json({ success: true, data: cls });
    } catch (err: any) {
      console.error("⚠️ assign teacher error:", err);
      return res.status(500).json({
        success: false,
        message: "Gán giáo viên thất bại",
      });
    }
  },
);

/**
 * 👨‍🎓 Thêm học sinh vào lớp
 * Route: POST /api/classes/:classCode/add-student
 */
router.post(
  "/:classCode/add-student",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { classCode } = req.params;
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu studentId",
        });
      }

      const cls = await ClassModel.findOne({ classCode });
      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Lớp chưa tồn tại, không thể thêm học sinh",
        });
      }

      const studentObjectId = new mongoose.Types.ObjectId(studentId);
      if (!cls.studentIds.some((id) => id.equals(studentObjectId))) {
        cls.studentIds.push(studentObjectId);
        await cls.save();
      }

      console.log("✅ Student added:", classCode);
      return res.status(200).json({ success: true, data: cls });
    } catch (err: any) {
      console.error("⚠️ add student error:", err);
      return res.status(500).json({
        success: false,
        message: "Thêm học sinh thất bại",
      });
    }
  },
);

/**
 * 🧩 GÁN GIÁO VIÊN BẰNG CONTROLLER RIÊNG
 * Route: POST /api/classes/assign
 */
router.post("/assign", verifyToken, checkRole(["admin"]), assignTeacherToClass);

export default router;
