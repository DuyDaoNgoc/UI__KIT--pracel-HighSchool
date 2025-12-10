import express from "express";
import Timetable from "../../models/Timetable";
import ClassModel from "../../models/Class";
import Subject from "../../models/Subject";

const router = express.Router();

// Tạo thời khóa biểu cho lớp
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

    const timetable = new Timetable({ classId, schedule });
    await timetable.save();

    res.status(201).json({ message: "Timetable created", timetable });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
