import express from "express";
import Payment from "../../models/Payment";
import Student from "../../models/Student";
import Subject from "../../models/Subject";

const router = express.Router();

// Tạo khoản thu học phí cho học sinh
router.post("/", async (req, res) => {
  try {
    const { studentId, subjectId } = req.body;

    const student = await Student.findById(studentId);
    const subject = await Subject.findById(subjectId);

    if (!student) return res.status(404).json({ message: "Student not found" });
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const payment = new Payment({
      studentId,
      subjectId,
      amount: subject.price,
      status: "unpaid",
      date: new Date(),
    });

    await payment.save();

    res.status(201).json({ message: "Payment created", payment });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
