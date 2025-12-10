import express from "express";
import Student from "../../models/Student";

const router = express.Router();

// Lấy danh sách tất cả học sinh
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json({ data: students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Lấy học sinh theo ID
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json({ data: student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
