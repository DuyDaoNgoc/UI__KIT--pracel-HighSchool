import express from "express";
import GradeLock from "../../models/GradeLock";
import Subject from "../../models/Subject";
import ClassModel from "../../models/Class";
import { verifyToken, checkRole } from "../../middleware/authMiddleware";

const router = express.Router();

// Lấy trạng thái khóa điểm của một môn học trong lớp
router.get(
  "/lock/status/:classId/:subjectId",
  verifyToken,
  async (req, res) => {
    try {
      const { classId, subjectId } = req.params;
      const lock = await GradeLock.findOne({ classId, subjectId });
      res.status(200).json({
        isLocked: lock?.isLocked || false,
        lockedAt: lock?.lockedAt,
        lockedBy: lock?.lockedBy,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

// Lấy tất cả khóa điểm
router.get("/locks", verifyToken, checkRole(["admin"]), async (req, res) => {
  try {
    const locks = await GradeLock.find()
      .populate("subjectId")
      .populate("classId");
    res.status(200).json({ data: locks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Lấy khóa điểm theo lớp
router.get("/locks/class/:classId", verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const locks = await GradeLock.find({ classId }).populate("subjectId");
    res.status(200).json({ data: locks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Khóa điểm cho một môn học trong lớp (Admin)
router.post(
  "/lock/:classId/:subjectId",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { classId, subjectId } = req.params;

      const subject = await Subject.findById(subjectId);
      const cls = await ClassModel.findById(classId);

      if (!subject)
        return res.status(404).json({ message: "Subject not found" });
      if (!cls) return res.status(404).json({ message: "Class not found" });

      let lock = await GradeLock.findOne({ classId, subjectId });
      if (!lock) {
        lock = new GradeLock({
          classId,
          subjectId,
          isLocked: true,
          lockedAt: new Date(),
          lockedBy: (req as any).user?.id,
        });
      } else {
        lock.isLocked = true;
        lock.lockedAt = new Date();
        lock.lockedBy = (req as any).user?.id;
      }

      await lock.save();
      res.status(200).json({ message: "Grade locked successfully", lock });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

// Mở khóa điểm cho một môn học trong lớp (Admin)
router.post(
  "/unlock/:classId/:subjectId",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { classId, subjectId } = req.params;

      const lock = await GradeLock.findOne({ classId, subjectId });
      if (!lock) {
        return res.status(404).json({ message: "Lock not found" });
      }

      lock.isLocked = false;
      lock.lockedAt = undefined;
      lock.lockedBy = undefined;
      await lock.save();

      res.status(200).json({ message: "Grade unlocked successfully", lock });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

// Xóa khóa điểm
router.delete(
  "/lock/:lockId",
  verifyToken,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { lockId } = req.params;
      await GradeLock.findByIdAndDelete(lockId);
      res.status(200).json({ message: "Lock deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

export default router;
