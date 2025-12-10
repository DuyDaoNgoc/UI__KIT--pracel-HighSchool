import express from "express";
import Subject from "../../models/Subject";
import ClassModel from "../../models/Class";

const router = express.Router();

// Lấy tất cả môn học
router.get("/", async (req, res) => {
  try {
    const subjects = await Subject.find().populate("classId");
    res.status(200).json({ data: subjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Lấy môn học theo lớp
router.get("/class/:classId", async (req, res) => {
  try {
    const { classId } = req.params;
    const subjects = await Subject.find({ classId }).populate("classId");
    res.status(200).json({ data: subjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Lấy chi tiết một môn học
router.get("/:id", async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate("classId");
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json({ data: subject });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

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
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Cập nhật môn học
router.patch("/:id", async (req, res) => {
  try {
    const { name, price } = req.body;
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, price },
      { new: true },
    );
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json({ message: "Subject updated", subject });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Xóa môn học
router.delete("/:id", async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    res.status(200).json({ message: "Subject deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
