import express from "express";
import Subject from "../../models/Subject";
import ClassModel from "../../models/Class";

const router = express.Router();

// Tạo môn học mới
router.post("/", async (req, res) => {
  try {
    const { name, price, classId } = req.body;

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    const subject = new Subject({ name, price, classId });
    await subject.save();

    res.status(201).json({ message: "Subject created", subject });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
