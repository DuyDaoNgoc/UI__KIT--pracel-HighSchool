import express from "express";
import PostponeRequest from "../../models/PostponeRequest";
import Timetable from "../../models/Timetable";
import {
  verifyToken,
  requireAdmin,
  requireTeacher,
  AuthRequest,
} from "../../middleware/authMiddleware";

const router = express.Router();

// Teacher: create a postpone request
router.post("/", verifyToken, requireTeacher, async (req: any, res) => {
  try {
    const user = (req as AuthRequest).user;
    const { itemId, timetableId, classId, subject, reason, requestedDate } =
      req.body;

    const r = new PostponeRequest({
      itemId,
      timetableId,
      classId,
      subject,
      reason,
      requestedDate,
      status: "pending",
      createdBy: user?.id,
      teacherId: user?.id,
    });

    await r.save();

    // Optionally notify admins via socket/event (not implemented here)

    res.status(201).json({ data: r, message: "Request created" });
  } catch (err) {
    console.error("create postpone request error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Teacher: list own requests
router.get("/me", verifyToken, requireTeacher, async (req: any, res) => {
  try {
    const user = (req as AuthRequest).user;
    const list = await PostponeRequest.find({ teacherId: user?.id }).sort({
      createdAt: -1,
    });
    res.json({ data: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Admin: list all requests
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const list = await PostponeRequest.find()
      .sort({ createdAt: -1 })
      .populate("teacherId");
    res.json({ data: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Admin: review (approve/reject) a request
router.patch("/:id", verifyToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status, reviewReason } = req.body;
    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const reqDoc = await PostponeRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ message: "Request not found" });

    reqDoc.status = status as any;
    reqDoc.reviewReason = reviewReason;
    reqDoc.reviewedBy = (req as AuthRequest).user?.id;
    await reqDoc.save();

    // If approved and request refers to a timetable item, add requestedDate to timetable.schedule.canceledDates
    if (status === "approved" && reqDoc.timetableId && reqDoc.itemId) {
      try {
        const tt = await Timetable.findById(reqDoc.timetableId);
        if (tt) {
          const sub = tt.schedule.id(reqDoc.itemId as any);
          if (sub) {
            sub.canceledDates = sub.canceledDates || [];
            if (reqDoc.requestedDate)
              sub.canceledDates.push(reqDoc.requestedDate);
            else sub.canceledDates.push(new Date().toISOString());
            await tt.save();
          }
        }
      } catch (e) {
        console.error("Failed to mark timetable item as canceled:", e);
      }
    }

    res.json({ data: reqDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
