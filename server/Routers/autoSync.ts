import express from "express";
import ClassModel from "../models/Class";
import Student from "../models/Student";
import Subject, { ISubject } from "../models/Subject";
import Timetable, { ITimetable } from "../models/Timetable";
import Payment, { IPayment } from "../models/Payment";
import mongoose from "mongoose";
const router = express.Router();

interface ScheduleInput {
  day: string;
  subjectName: string;
  startTime: string;
  endTime: string;
}

interface SubjectInput {
  name: string;
  price: number;
}

router.post("/", async (req, res) => {
  try {
    const {
      classId,
      subjects,
      schedule,
    }: {
      classId: string;
      subjects: SubjectInput[];
      schedule: ScheduleInput[];
    } = req.body;

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // 1️⃣ Tạo môn học
    const subjectDocs: ISubject[] = [];
    for (const s of subjects) {
      const existing = await Subject.findOne({ name: s.name, classId });
      if (existing) {
        subjectDocs.push(existing);
        continue;
      }
      const subj = new Subject({ name: s.name, price: s.price, classId });
      await subj.save();
      subjectDocs.push(subj);
    }

    const timetableSchedule: {
      day: string;
      subjectId: mongoose.Types.ObjectId;
      startTime: string;
      endTime: string;
    }[] = [];

    for (const s of schedule) {
      const subj = subjectDocs.find((subj) => subj.name === s.subjectName);
      if (!subj) continue;

      const subjId = subj._id as mongoose.Types.ObjectId; // ép kiểu
      timetableSchedule.push({
        day: s.day,
        subjectId: subjId,
        startTime: s.startTime,
        endTime: s.endTime,
      });
    }

    let timetable = await Timetable.findOne({ classId });
    if (!timetable) {
      timetable = new Timetable({ classId, schedule: timetableSchedule });
    } else {
      timetable.schedule = timetableSchedule; // ghi đè
    }
    await timetable.save();

    // 3️⃣ Tạo Payment cho tất cả học sinh trong lớp
    const students = await Student.find({ classCode: cls.classCode });
    const payments: IPayment[] = [];
    for (const student of students) {
      for (const subj of subjectDocs) {
        const existingPayment = await Payment.findOne({
          studentId: student._id,
          subjectId: subj._id,
        });
        if (existingPayment) continue;

        const payment = new Payment({
          studentId: student._id,
          subjectId: subj._id,
          amount: subj.price,
          status: "unpaid",
          date: new Date(),
        });
        await payment.save();
        payments.push(payment);
      }
    }

    res.status(201).json({
      message: "Auto sync completed",
      subjects: subjectDocs,
      timetable,
      paymentsCreated: payments.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

export default router;
