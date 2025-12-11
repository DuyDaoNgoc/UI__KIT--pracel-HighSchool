import { Router, Request, Response } from "express";
import ReportModel from "../../models/Report";
import { verifyToken } from "../../middleware/authMiddleware";

const router = Router();

/**
 * 📋 GET /reports
 * Fetch reports for a specific date, optionally filtered by teacherId or studentId
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { date, teacherId, studentId } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp tham số 'date'",
      });
    }

    const filter: any = { date };
    if (teacherId) filter.teacherId = teacherId;
    if (studentId) filter.studentId = studentId;

    const reports = await ReportModel.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (err: any) {
    console.error("❌ Error fetching reports:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi tải báo cáo",
      error: err?.message,
    });
  }
});

/**
 * 📋 POST /reports
 * Create a new report
 */
router.post("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const { date, studentId, status, notes, teacherId } = req.body;

    if (!date || !studentId || !status) {
      return res.status(400).json({
        success: false,
        message: "Cần cung cấp: date, studentId, status",
      });
    }

    const report = await ReportModel.create({
      date,
      studentId,
      teacherId: teacherId || req.user?.id,
      status,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Báo cáo đã tạo",
      data: report,
    });
  } catch (err: any) {
    console.error("❌ Error creating report:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi tạo báo cáo",
      error: err?.message,
    });
  }
});

/**
 * 📋 PUT /reports/:id
 * Update an existing report
 */
router.put("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const report = await ReportModel.findByIdAndUpdate(
      id,
      { status, notes },
      { new: true },
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Báo cáo không tìm thấy",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Báo cáo đã cập nhật",
      data: report,
    });
  } catch (err: any) {
    console.error("❌ Error updating report:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi cập nhật báo cáo",
      error: err?.message,
    });
  }
});

/**
 * 📋 DELETE /reports/:id
 * Delete a report
 */
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await ReportModel.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Báo cáo không tìm thấy",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Báo cáo đã xóa",
    });
  } catch (err: any) {
    console.error("❌ Error deleting report:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi xóa báo cáo",
      error: err?.message,
    });
  }
});

export default router;
