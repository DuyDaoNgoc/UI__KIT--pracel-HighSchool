import express from "express";
import Timetable from "../../models/Timetable";
import ClassModel from "../../models/Class";
import Subject from "../../models/Subject";
import User from "../../models/User";
import { verifyToken, requireAdmin } from "../../middleware/authMiddleware";

const router = express.Router();

// Lấy tất cả thời khóa biểu
router.get("/", async (req, res) => {
  try {
    const timetables = await Timetable.find()
      .populate("classId")
      .populate("schedule.subjectId");
    res.status(200).json({ data: timetables });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Lấy thời khóa biểu theo lớp
router.get("/class/:classId", async (req, res) => {
  try {
    const { classId } = req.params;
    const timetable = await Timetable.findOne({ classId })
      .populate("classId")
      .populate("schedule.subjectId");
    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });
    res.status(200).json({ data: timetable });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Lấy chi tiết một thời khóa biểu
router.get("/:id", async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate("classId")
      .populate("schedule.subjectId");
    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });
    res.status(200).json({ data: timetable });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Tạo thời khóa biểu mới
router.post("/", async (req, res) => {
  try {
    const { classId, schedule } = req.body;

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // Kiểm tra tất cả subjectId trong schedule có tồn tại không
    for (const s of schedule) {
      // allow empty subjectId (day off) — skip validation when missing
      if (!s.subjectId) continue;
      const subj = await Subject.findById(s.subjectId);
      if (!subj)
        return res
          .status(404)
          .json({ message: `Subject ${s.subjectId} not found` });
    }

    let timetable = await Timetable.findOne({ classId });
    if (timetable) {
      // Merge new schedule items with existing ones to preserve old weeks (history)
      // Avoid duplicates by checking: week + day + startTime + endTime + subjectId
      const existingSchedule = timetable.schedule || [];
      const mergedSchedule = [...existingSchedule];

      for (const newItem of schedule) {
        const key = `${newItem.week || ""}::${newItem.day}::${newItem.startTime}::${newItem.endTime}::${newItem.subjectId || ""}`;
        const isDuplicate = existingSchedule.some((existing: any) => {
          const existingKey = `${existing.week || ""}::${existing.day}::${existing.startTime}::${existing.endTime}::${existing.subjectId || ""}`;
          return key === existingKey;
        });
        if (!isDuplicate) {
          mergedSchedule.push(newItem);
        }
      }

      timetable.schedule = mergedSchedule;
      await timetable.save();
    } else {
      timetable = new Timetable({ classId, schedule });
      await timetable.save();
    }

    // --- Sync schedule to students' user accounts ---
    try {
      // populate subject names for a user-friendly schedule
      const populated = await Timetable.findById(timetable._id).populate(
        "schedule.subjectId",
      );

      const userSchedule = (populated?.schedule || []).map((s: any) => ({
        day: s.day,
        subject:
          (s.subjectId && (s.subjectId.name || s.subjectId.title)) ||
          (s.subjectId ? String(s.subjectId) : "Trống"),
        startTime: s.startTime,
        endTime: s.endTime,
      }));

      const clsStudents = (cls.studentIds || []).map((id: any) => id);
      if (clsStudents.length > 0) {
        await User.updateMany(
          { _id: { $in: clsStudents } },
          { $set: { schedule: userSchedule } },
        );
      }

      // (no teacher user sync here — keep original behavior: only students receive schedule)
    } catch (syncErr) {
      console.error("Failed to sync timetable to users:", syncErr);
    }

    res.status(201).json({ message: "Timetable created", timetable });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Cập nhật thời khóa biểu
router.patch("/:id", async (req, res) => {
  try {
    const { schedule } = req.body;

    // Kiểm tra tất cả subjectId có tồn tại không (skip empty -> day off)
    for (const s of schedule) {
      if (!s.subjectId) continue;
      const subj = await Subject.findById(s.subjectId);
      if (!subj)
        return res
          .status(404)
          .json({ message: `Subject ${s.subjectId} not found` });
    }

    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { schedule },
      { new: true },
    )
      .populate("classId")
      .populate("schedule.subjectId");

    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });

    // --- Sync schedule to students' user accounts ---
    try {
      // timetable is already populated with subjectId
      const userSchedule = (timetable.schedule || []).map((s: any) => ({
        day: s.day,
        subject:
          (s.subjectId && (s.subjectId.name || s.subjectId.title)) ||
          (s.subjectId ? String(s.subjectId) : "Trống"),
        startTime: s.startTime,
        endTime: s.endTime,
      }));

      const cls = await ClassModel.findById(timetable.classId);
      const clsStudents = (cls?.studentIds || []).map((id: any) => id);
      if (clsStudents.length > 0) {
        await User.updateMany(
          { _id: { $in: clsStudents } },
          { $set: { schedule: userSchedule } },
        );
      }

      // (no teacher user sync here)
    } catch (syncErr) {
      console.error("Failed to sync updated timetable to users:", syncErr);
    }

    res.status(200).json({ message: "Timetable updated", timetable });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Xóa thời khóa biểu
router.delete("/:id", async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    if (!timetable)
      return res.status(404).json({ message: "Timetable not found" });
    res.status(200).json({ message: "Timetable deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;

// --- Admin endpoint: backfill/sync all timetables into users collection ---
router.post("/sync-to-users", verifyToken, requireAdmin, async (req, res) => {
  try {
    const timetables = await Timetable.find().populate("schedule.subjectId");

    for (const tt of timetables) {
      const cls = await ClassModel.findById(tt.classId);
      if (!cls) continue;

      const userSchedule = (tt.schedule || []).map((s: any) => ({
        day: s.day,
        subject:
          (s.subjectId && (s.subjectId.name || s.subjectId.title)) ||
          String(s.subjectId),
        startTime: s.startTime,
        endTime: s.endTime,
      }));

      const clsStudents = (cls.studentIds || []).map((id: any) => id);
      if (clsStudents.length > 0) {
        await User.updateMany(
          { _id: { $in: clsStudents } },
          { $set: { schedule: userSchedule } },
        );
      }
      // (do not sync to teacher user in backfill — keep original behavior)
    }

    res.json({ success: true, message: "Sync completed" });
  } catch (err) {
    console.error("sync-to-users error:", err);
    res
      .status(500)
      .json({ success: false, message: "Sync failed", error: err });
  }
});
