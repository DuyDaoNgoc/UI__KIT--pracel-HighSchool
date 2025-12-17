import express from "express";
import Subject from "../../models/Subject";
import ClassModel from "../../models/Class";
import { getIo } from "../../utils/socketio";

const router = express.Router();

// Tạo môn học mới
router.post("/", async (req, res) => {
  try {
    const { name, price, classId } = req.body;

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const subject = new Subject({ name, price, classId });
    await subject.save();

    // Emit subject created event
    try {
      const io = getIo();
      if (io) {
        io.to("role:admin").emit("subject:created", { subject });
        // If subject tied to a class, notify that class room
        if (classId)
          io.to(`class:${classId}`).emit("subject:created", { subject });
      }
    } catch (emitErr) {
      console.warn("⚠️ [createSubject] Socket emit failed:", emitErr);
    }

    res.status(201).json({ message: "Subject created", subject });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
