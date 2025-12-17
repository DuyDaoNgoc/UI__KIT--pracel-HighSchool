import express from "express";
import Payment from "../../models/Payment";
import Student from "../../models/Student";
import Subject from "../../models/Subject";
import { getIo } from "../../utils/socketio";

const router = express.Router();

// Lấy tất cả khoản thanh toán
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("studentId")
      .populate("subjectId");
    res.status(200).json({ data: payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Lấy khoản thanh toán của một học sinh
router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const payments = await Payment.find({ studentId })
      .populate("studentId")
      .populate("subjectId");
    res.status(200).json({ data: payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Lấy chi tiết một khoản thanh toán
router.get("/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("studentId")
      .populate("subjectId");
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.status(200).json({ data: payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Tạo khoản thanh toán
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

    // Emit payment created
    try {
      const io = getIo();
      if (io) {
        io.to("role:admin").emit("payment:created", { payment });
        io.to(`user:${studentId}`).emit("payment:created", { payment });
      }
    } catch (emitErr) {
      console.warn("⚠️ [Payment] emit failed:", emitErr);
    }

    res.status(201).json({ message: "Payment created", payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Cập nhật trạng thái thanh toán
router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["paid", "unpaid"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    )
      .populate("studentId")
      .populate("subjectId");

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // Emit payment updated
    try {
      const io = getIo();
      if (io) {
        io.to("role:admin").emit("payment:updated", { payment });
        // notify student
        if (payment.studentId)
          io.to(`user:${payment.studentId}`).emit("payment:updated", {
            payment,
          });
      }
    } catch (emitErr) {
      console.warn("⚠️ [Payment] emit failed:", emitErr);
    }

    res.status(200).json({ message: "Payment updated", payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Xóa khoản thanh toán
router.delete("/:id", async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    try {
      const io = getIo();
      if (io) {
        io.to("role:admin").emit("payment:deleted", {
          paymentId: req.params.id,
        });
        if (payment.studentId)
          io.to(`user:${payment.studentId}`).emit("payment:deleted", {
            paymentId: req.params.id,
          });
      }
    } catch (emitErr) {
      console.warn("⚠️ [Payment] emit failed:", emitErr);
    }

    res.status(200).json({ message: "Payment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
