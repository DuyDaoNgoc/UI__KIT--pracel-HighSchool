import express from "express";
import Student from "../../models/Student";
import User from "../../models/User";
import { generateClassCode } from "../../helpers/classCode";

const router = express.Router();

// Lấy danh sách tất cả học sinh
router.get("/", async (req, res) => {
  try {
    console.log("🔍 Fetching students...");
    const startTime = Date.now();

    // Fetch students from User collection (where they're actually created)
    const students = await User.find({ role: "student" })
      .select(
        "_id studentId username email phone dob gender classCode grade class major schoolYear",
      )
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    console.log(
      `✅ Fetched ${students.length} students in ${Date.now() - startTime}ms`,
    );

    // Map to proper format và generate classCode nếu không có
    const formattedStudents = students.map((s: any) => {
      // Mặc định nếu không có grade, class, major
      const grade = s.grade || "10";
      const classLetter = s.class || "A";
      const major = s.major || "Không chuyên";

      let classCode = s.classCode;

      // Auto-generate classCode nếu không có
      if (!classCode) {
        classCode = generateClassCode(grade, classLetter, major);
        console.log(
          `🔧 Auto-generated classCode for ${s.studentId}: ${classCode}`,
        );
      }

      return {
        _id: s._id,
        studentId: s.studentId,
        name: s.username,
        email: s.email,
        phone: s.phone,
        dob: s.dob,
        gender: s.gender,
        classCode,
        grade,
        classLetter,
        major,
        schoolYear: s.schoolYear,
      };
    });

    // Return as direct array (not {data: array})
    res.status(200).json(formattedStudents);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Debug - Kiểm tra tổng số học sinh
router.get("/debug/count", async (req, res) => {
  try {
    const count = await User.countDocuments({ role: "student" });
    const sample = await User.find({ role: "student" }).limit(3).lean();
    console.log(`📊 Total students: ${count}`);
    console.log("📝 Sample students:", sample);
    res.status(200).json({ totalStudents: count, sampleStudents: sample });
  } catch (err) {
    console.error("❌ Debug error:", err);
    res.status(500).json({ message: "Debug error", error: err });
  }
});

// Debug - Kiểm tra giáo viên GV00002
router.get("/debug/teacher", async (req, res) => {
  try {
    const Teacher = require("../../models/teacherModel").default;
    const teacher = await Teacher.findOne({ teacherId: "GV00002" });
    console.log(`📚 Teacher GV00002:`, teacher);
    res.status(200).json({ teacher });
  } catch (err) {
    console.error("❌ Debug error:", err);
    res.status(500).json({ message: "Debug error", error: err });
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
