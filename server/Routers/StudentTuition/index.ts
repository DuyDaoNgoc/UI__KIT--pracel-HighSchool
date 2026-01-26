import express, { Request, Response } from "express";
import StudentTuition from "../../models/StudentTuition";
import { verifyToken, checkRole } from "../../middleware/authMiddleware";
import mongoose from "mongoose";
import { getIo } from "../../utils/socketio";

const router = express.Router();

/**
 * GET /api/student-tuition
 * Lấy tất cả bảng học phí của học sinh
 * Admin only
 */
router.get(
  "/",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      console.log("🔍 [StudentTuition] GET / - Fetching all student tuitions");

      const allStudentTuitions = await StudentTuition.find()
        .populate({
          path: "studentId",
          select: "_id studentId name email phone",
        })
        .populate({
          path: "tuitionId",
          select: "_id classId semester totalAmount",
        })
        .sort({ createdAt: -1 });

      // Filter out records where populate failed (studentId is null)
      const studentTuitions = allStudentTuitions.filter((st: any) => {
        if (!st.studentId || !st.studentId._id) {
          console.warn(
            `⚠️ [StudentTuition] Skipping record with invalid studentId:`,
            st._id,
            "- studentId:",
            st.studentId,
          );
          return false;
        }
        return true;
      });

      console.log(
        "📦 [StudentTuition] GET / - Valid records:",
        studentTuitions.length,
        "/ Total:",
        allStudentTuitions.length,
      );

      res.status(200).json({ success: true, data: studentTuitions });
    } catch (err) {
      console.error("❌ GET /student-tuition error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

/**
 * GET /api/student-tuition/debug/all-raw
 * Debug endpoint - Get all StudentTuition raw data for debugging
 * Admin only
 */
router.get(
  "/debug/all-raw",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const allRecords = await StudentTuition.find().lean();

      console.log(
        "🔍 [StudentTuition] DEBUG all-raw - Total records:",
        allRecords.length,
      );
      console.log(
        "📋 [StudentTuition] DEBUG all-raw - Records:",
        JSON.stringify(allRecords, null, 2),
      );

      res.status(200).json({
        success: true,
        totalRecords: allRecords.length,
        data: allRecords,
        sampleStudentIds: allRecords.slice(0, 5).map((r: any) => ({
          id: r._id,
          studentId: r.studentId,
          studentIdType: typeof r.studentId,
          studentIdString: String(r.studentId),
          tuitionId: r.tuitionId,
        })),
      });
    } catch (err) {
      console.error("❌ DEBUG all-raw error:", err);
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err });
    }
  },
);

/**
 * GET /api/student-tuition/:id
 * Lấy chi tiết một bảng học phí của học sinh
 */
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const studentTuition = await StudentTuition.findById(id)
      .populate("studentId")
      .populate("tuitionId");

    if (!studentTuition) {
      return res.status(404).json({ message: "Student tuition not found" });
    }

    res.status(200).json({ success: true, data: studentTuition });
  } catch (err) {
    console.error("❌ GET /student-tuition/:id error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

/**
 * GET /api/student-tuition/student/:studentId
 * Lấy danh sách học phí của một học sinh
 */
router.get(
  "/student/:studentId",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      console.log(
        "🔍 [StudentTuition] GET /student/:studentId - studentId:",
        studentId,
        "Type:",
        typeof studentId,
      );

      // Try string query first
      let studentTuitions = await StudentTuition.find({ studentId })
        .populate({
          path: "tuitionId",
          select:
            "_id classId semester totalAmount subjects description isActive",
        })
        .populate({
          path: "studentId",
          select: "_id studentId name email phone",
        })
        .sort({ createdAt: -1 });

      console.log(
        "📦 [StudentTuition] String query result:",
        studentTuitions.length,
        "records",
      );

      // If no results with string, try converting to ObjectId
      if (
        studentTuitions.length === 0 &&
        mongoose.Types.ObjectId.isValid(studentId)
      ) {
        console.log(
          "⚠️ [StudentTuition] String query returned 0, trying ObjectId conversion",
        );
        const objectId = new mongoose.Types.ObjectId(studentId);

        studentTuitions = await StudentTuition.find({ studentId: objectId })
          .populate({
            path: "tuitionId",
            select:
              "_id classId semester totalAmount subjects description isActive",
          })
          .populate({
            path: "studentId",
            select: "_id studentId name email phone",
          })
          .sort({ createdAt: -1 });

        console.log(
          "📦 [StudentTuition] ObjectId query result:",
          studentTuitions.length,
          "records",
        );
      }

      if (studentTuitions.length === 0) {
        console.warn(
          "⚠️ [StudentTuition] No tuitions found for studentId:",
          studentId,
        );

        // Debug: show sample records to see format
        const allRecords = await StudentTuition.find({})
          .select("studentId")
          .lean();
        console.log(
          "📋 [StudentTuition] Total records in DB:",
          allRecords.length,
        );
        if (allRecords.length > 0) {
          console.log(
            "📋 [StudentTuition] Sample stored studentIds:",
            allRecords.slice(0, 3).map((r: any) => ({
              stored: r.studentId,
              storedType: typeof r.studentId,
              storedString: String(r.studentId),
              queryString: studentId,
              matches: String(r.studentId) === studentId,
            })),
          );
        }
      } else {
        console.log(
          "✅ [StudentTuition] Found",
          studentTuitions.length,
          "records",
        );
      }

      res.status(200).json({ success: true, data: studentTuitions });
    } catch (err) {
      console.error("❌ GET /student-tuition/student/:studentId error:", err);
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err });
    }
  },
);

/**
 * PUT /api/student-tuition/:id
 * Cập nhật trạng thái thanh toán của một học sinh
 * Admin only
 */
router.put(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { paidAmount, status, notes } = req.body;

      console.log("📝 Updating student tuition:", id, { paidAmount, status });

      const studentTuition = await StudentTuition.findById(id);
      if (!studentTuition) {
        return res.status(404).json({ message: "Student tuition not found" });
      }

      // Update fields
      if (paidAmount !== undefined) {
        studentTuition.paidAmount = paidAmount;
        // Auto-calculate remaining
        studentTuition.remainingAmount = Math.max(
          0,
          studentTuition.totalAmount - paidAmount,
        );
      }

      if (status !== undefined) {
        studentTuition.status = status;
      }

      if (notes !== undefined) {
        studentTuition.notes = notes;
      }

      await studentTuition.save();
      await studentTuition.populate("studentId");
      await studentTuition.populate("tuitionId");

      console.log("✅ Student tuition updated:", id);

      // Emit socket event to notify all connected clients
      try {
        const io = getIo();
        if (io) {
          console.log(
            "📡 [StudentTuition] Emitting student-tuition:updated event",
          );
          io.emit("student-tuition:updated", {
            _id: studentTuition._id,
            studentId: studentTuition.studentId,
            paidAmount: studentTuition.paidAmount,
            remainingAmount: studentTuition.remainingAmount,
            status: studentTuition.status,
            totalAmount: studentTuition.totalAmount,
          });
        }
      } catch (socketErr) {
        console.error("⚠️ Socket emit error (non-blocking):", socketErr);
      }

      res.status(200).json({
        success: true,
        message: "Student tuition updated successfully",
        data: studentTuition,
      });
    } catch (err) {
      console.error("❌ PUT /student-tuition/:id error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

/**
 * DELETE /api/student-tuition/:id
 * Xóa bảng học phí của một học sinh
 * Admin only
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      console.log("🗑️ Deleting student tuition:", id);

      const studentTuition = await StudentTuition.findByIdAndDelete(id);
      if (!studentTuition) {
        return res.status(404).json({ message: "Student tuition not found" });
      }

      console.log("✅ Student tuition deleted:", id);
      res
        .status(200)
        .json({ success: true, message: "Student tuition deleted" });
    } catch (err) {
      console.error("❌ DELETE /student-tuition/:id error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

/**
 * GET /api/student-tuition/debug/search/:studentId
 * Debug endpoint - Search by specific studentId to debug fetch issues
 * Admin only
 */
router.get(
  "/debug/search/:studentId",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      console.log(
        "🔍 [StudentTuition] DEBUG search - studentId:",
        studentId,
        "Type:",
        typeof studentId,
      );

      // Try different query methods
      const directQuery = await StudentTuition.find({ studentId }).lean();
      console.log(
        "📋 [StudentTuition] Direct query result:",
        directQuery.length,
      );

      const allRecords = await StudentTuition.find({}).lean();
      console.log("📋 [StudentTuition] All records in DB:", allRecords.length);

      const matchingRecords = allRecords.filter((r: any) => {
        const recordStudentId = String(r.studentId);
        const queryStudentId = String(studentId);
        console.log(
          `  Comparing: "${recordStudentId}" === "${queryStudentId}" => ${recordStudentId === queryStudentId}`,
        );
        return recordStudentId === queryStudentId;
      });

      res.status(200).json({
        success: true,
        search: { studentId, type: typeof studentId },
        directQuery: {
          count: directQuery.length,
          data: directQuery,
        },
        manualFilter: {
          count: matchingRecords.length,
          data: matchingRecords,
        },
        allRecords: allRecords.length,
        sampleRecords: allRecords.slice(0, 3).map((r: any) => ({
          _id: r._id,
          studentId: r.studentId,
          studentIdString: String(r.studentId),
          tuitionId: r.tuitionId,
        })),
      });
    } catch (err) {
      console.error("❌ DEBUG search error:", err);
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err });
    }
  },
);

export default router;
