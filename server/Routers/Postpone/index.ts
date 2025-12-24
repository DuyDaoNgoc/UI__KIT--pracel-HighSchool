import express from "express";
import PostponeRequest from "../../models/PostponeRequest";
import Timetable from "../../models/Timetable";
import mongoose from "mongoose";
import { getIo } from "../../utils/socketio";
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

    // emit socket event so connected clients can react to the review
    try {
      const io = getIo();
      if (io) io.emit("postpone:reviewed", { data: reqDoc });
    } catch (e) {
      console.warn("Failed to emit postpone:reviewed socket event", e);
    }

    // If approved and request refers to a timetable item, add requestedDate to timetable.schedule.canceledDates
    if (status === "approved" && reqDoc.timetableId && reqDoc.itemId) {
      try {
        const tt = await Timetable.findById(reqDoc.timetableId);
        if (tt) {
          let index = Number(reqDoc.itemId);
          if (!Number.isInteger(index)) {
            // itemId was not an integer index — try to find by subdocument _id
            index = tt.schedule.findIndex(
              (s: any) => String(s._id) === String(reqDoc.itemId),
            );
          }

          if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= tt.schedule.length
          ) {
            console.warn(
              "Cannot map postpone request.itemId to a schedule index:",
              reqDoc.itemId,
            );
          } else {
            const sub = tt.schedule[index];
            sub.canceledDates = sub.canceledDates || [];
            sub.canceledDates.push(
              reqDoc.requestedDate || new Date().toISOString(),
            );
            await tt.save();

            // notify via socket that timetable changed
            try {
              const io = getIo();
              if (io)
                io.emit("timetable:updated", {
                  classId: tt.classId,
                  timetableId: tt._id,
                });
            } catch (e) {
              console.warn("Failed to emit timetable:updated socket event", e);
            }
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
