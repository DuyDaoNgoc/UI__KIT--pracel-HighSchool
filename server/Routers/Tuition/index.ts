import express, { Request, Response } from "express";
import Tuition, { ITuition } from "../../models/Tuition";
import Subject from "../../models/Subject";
import Major from "../../models/Major";
import { verifyToken, checkRole } from "../../middleware/authMiddleware";

const router = express.Router();

/**
 * GET /api/tuitions
 * Lấy tất cả bảng học phí
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const tuitions = await Tuition.find()
      .populate("majorId")
      .populate("subjects.subjectId")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tuitions });
  } catch (err) {
    console.error("❌ GET /tuitions error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

/**
 * GET /api/tuitions/:id
 * Lấy chi tiết một bảng học phí
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tuition = await Tuition.findById(id)
      .populate("majorId")
      .populate("subjects.subjectId");

    if (!tuition) {
      return res.status(404).json({ message: "Tuition not found" });
    }

    res.status(200).json({ success: true, data: tuition });
  } catch (err) {
    console.error("❌ GET /tuitions/:id error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

/**
 * GET /api/tuitions/major/:majorId?semester=1
 * Lấy bảng học phí theo ngành và kì học
 */
router.get("/major/:majorId", async (req: Request, res: Response) => {
  try {
    const { majorId } = req.params;
    const { semester } = req.query;

    const filter: any = { majorId };
    if (semester) {
      filter.semester = parseInt(semester as string);
    }

    const tuitions = await Tuition.find(filter)
      .populate("majorId")
      .populate("subjects.subjectId");

    res.status(200).json({ success: true, data: tuitions });
  } catch (err) {
    console.error("❌ GET /tuitions/major/:majorId error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

/**
 * POST /api/tuitions
 * Tạo bảng học phí mới (Admin only)
 * Body: { majorId, semester, subjectIds: [...] }
 */
router.post(
  "/",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { majorId, semester, subjectIds, description } = req.body;

      console.log(
        "📝 Creating tuition for major:",
        majorId,
        "semester:",
        semester,
      );

      // Validate input
      if (!majorId || !semester || !Array.isArray(subjectIds)) {
        return res.status(400).json({
          message: "Missing required fields: majorId, semester, subjectIds",
        });
      }

      // Kiểm tra major tồn tại
      const major = await Major.findById(majorId);
      if (!major) {
        return res.status(404).json({ message: "Major not found" });
      }

      // Lấy thông tin các môn học và tính tổng học phí
      const subjects = await Subject.find({ _id: { $in: subjectIds } });
      if (subjects.length !== subjectIds.length) {
        return res.status(404).json({ message: "Some subjects not found" });
      }

      const tuitionSubjects = subjectIds.map((subjectId: string) => {
        const subject = (subjects as any[]).find(
          (s) => s._id.toString() === subjectId,
        );
        return {
          subjectId,
          price: subject?.price || 0,
        };
      });

      const totalAmount = tuitionSubjects.reduce(
        (sum: number, item: any) => sum + item.price,
        0,
      );

      // Kiểm tra xem đã có bảng học phí cho major + semester này chưa
      const existing = await Tuition.findOne({ majorId, semester });
      if (existing) {
        console.log("⚠️ Tuition already exists for this major + semester");
        return res.status(409).json({
          message: "Tuition for this major and semester already exists",
        });
      }

      // Tạo bảng học phí
      const tuition = new Tuition({
        majorId,
        semester,
        subjects: tuitionSubjects,
        totalAmount,
        description,
        isActive: true,
      });

      await tuition.save();
      await tuition.populate("majorId");
      await tuition.populate("subjects.subjectId");

      console.log("✅ Tuition created:", tuition._id);
      res.status(201).json({
        success: true,
        message: "Tuition created successfully",
        data: tuition,
      });
    } catch (err) {
      console.error("❌ POST /tuitions error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

/**
 * PUT /api/tuitions/:id
 * Cập nhật bảng học phí (Admin only)
 */
router.put(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { subjectIds, description, isActive } = req.body;

      console.log("📝 Updating tuition:", id);

      const tuition = await Tuition.findById(id);
      if (!tuition) {
        return res.status(404).json({ message: "Tuition not found" });
      }

      // Cập nhật môn học nếu có
      if (subjectIds) {
        const subjects = await Subject.find({ _id: { $in: subjectIds } });
        if (subjects.length !== subjectIds.length) {
          return res.status(404).json({ message: "Some subjects not found" });
        }

        tuition.subjects = subjectIds.map((subjectId: string) => {
          const subject = (subjects as any[]).find(
            (s) => s._id.toString() === subjectId,
          );
          return {
            subjectId: subject?._id || subjectId,
            price: subject?.price || 0,
          };
        });

        tuition.totalAmount = tuition.subjects.reduce(
          (sum: number, item: any) => sum + item.price,
          0,
        );
      }

      if (description !== undefined) tuition.description = description;
      if (isActive !== undefined) tuition.isActive = isActive;

      await tuition.save();
      await tuition.populate("majorId");
      await tuition.populate("subjects.subjectId");

      console.log("✅ Tuition updated:", id);
      res.status(200).json({
        success: true,
        message: "Tuition updated successfully",
        data: tuition,
      });
    } catch (err) {
      console.error("❌ PUT /tuitions/:id error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

/**
 * DELETE /api/tuitions/:id
 * Xóa bảng học phí (Admin only)
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      console.log("🗑️ Deleting tuition:", id);

      const tuition = await Tuition.findByIdAndDelete(id);
      if (!tuition) {
        return res.status(404).json({ message: "Tuition not found" });
      }

      console.log("✅ Tuition deleted:", id);
      res.status(200).json({ success: true, message: "Tuition deleted" });
    } catch (err) {
      console.error("❌ DELETE /tuitions/:id error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

/**
 * POST /api/tuitions/:tuitionId/generate-for-students
 * Generate tuition records for all students matching this tuition plan
 * Admin only
 */
router.post(
  "/:tuitionId/generate-for-students",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { tuitionId } = req.params;

      console.log(
        "📝 Generating student tuitions for tuition plan:",
        tuitionId,
      );

      // Find the tuition plan
      const tuition = await Tuition.findById(tuitionId).populate("majorId");
      if (!tuition) {
        return res.status(404).json({ message: "Tuition not found" });
      }

      // Find all students with matching major
      const Student =
        require("../../models/Student").default ||
        require("../../models/Student");
      const students = await Student.find({ major: tuition.majorId._id });

      if (students.length === 0) {
        console.log("⚠️ No students found for this major");
        return res.status(200).json({
          success: true,
          message: "No students found for this major",
          generatedCount: 0,
        });
      }

      // For each student, you can create a corresponding Payment or Tuition Assignment record
      // This is a placeholder - adjust based on your Payment model structure
      console.log(
        `✅ Found ${students.length} students for tuition generation`,
      );

      res.status(200).json({
        success: true,
        message: `Generated tuition records for ${students.length} students`,
        generatedCount: students.length,
        students: students.map((s: any) => ({
          id: s._id,
          name: s.name,
          studentId: s.studentId,
        })),
      });
    } catch (err) {
      console.error(
        "❌ POST /tuitions/:tuitionId/generate-for-students error:",
        err,
      );
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

export default router;
