import express from "express";
import Timetable from "../../models/Timetable";
import ClassModel from "../../models/Class";
import Subject from "../../models/Subject";

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
      const subj = await Subject.findById(s.subjectId);
      if (!subj)
        return res
          .status(404)
          .json({ message: `Subject ${s.subjectId} not found` });
    }

    let timetable = await Timetable.findOne({ classId });
    if (timetable) {
      timetable.schedule = schedule;
      await timetable.save();
    } else {
      timetable = new Timetable({ classId, schedule });
      await timetable.save();
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

    // Kiểm tra tất cả subjectId có tồn tại không
    for (const s of schedule) {
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
