import express from "express";
import Timetable from "../../models/Timetable";
import ClassModel from "../../models/Class";
import Subject from "../../models/Subject";

const router = express.Router();

// Tạo thời khóa biểu cho lớp
router.post("/", async (req, res) => {
  try {
    const { classId, schedule } = req.body;
    console.log("📥 [Backend] createTimetable received:", {
      classId,
      scheduleCount: schedule.length,
      schedule: schedule.map((s: any) => ({
        day: s.day,
        subjectId: s.subjectId,
        teacherId: s.teacherId,
      })),
    });

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // Kiểm tra tất cả subjectId và teacherId trong schedule có tồn tại không
    for (const s of schedule) {
      const subj = await Subject.findById(s.subjectId);
      if (!subj)
        return res
          .status(404)
          .json({ message: `Subject ${s.subjectId} not found` });

      // Validate teacherId is provided and is valid ObjectId
      if (!s.teacherId)
        return res.status(400).json({
          message: `teacherId is required for subject ${s.subjectId}`,
        });

      // Check if teacherId exists as User
      const teacher = await User.findById(s.teacherId);
      if (!teacher)
        return res
          .status(404)
          .json({ message: `Teacher ${s.teacherId} not found` });
    }

    // Map schedule to ensure all fields including teacherId are saved
    const scheduleWithTeacher = schedule.map((item: any) => ({
      day: item.day,
      week: item.week,
      subjectId: item.subjectId,
      teacherId: item.teacherId,
      periodFrom: item.periodFrom,
      canceledDates: item.canceledDates,
      startTime: item.startTime,
      endTime: item.endTime,
    }));

    console.log(
      "💾 [Backend] Saving timetable with schedule:",
      scheduleWithTeacher,
    );

    const timetable = new Timetable({ classId, schedule: scheduleWithTeacher });
    const saved = await timetable.save();

    console.log("✅ [Backend] Timetable saved:", {
      _id: saved._id,
      classId: saved.classId,
      scheduleCount: saved.schedule.length,
      schedule: saved.schedule.map((s: any) => ({
        day: s.day,
        teacherId: s.teacherId,
      })),
    });

    res.status(201).json({ message: "Timetable created", timetable: saved });
  } catch (err) {
    console.error("❌ [Backend] createTimetable error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
