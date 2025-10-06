"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/Routers/studentAuth.ts
const express_1 = require("express");
const User_1 = __importDefault(require("../../models/User")); // chỉ import model
const authMiddleware_1 = require("../../middleware/authMiddleware");
const Class_1 = __importDefault(require("../../models/Class"));
const classCode_1 = require("../../helpers/classCode"); // ✅ helper sinh mã lớp
const router = (0, express_1.Router)();
// POST /api/admin/students/create
router.post("/create", authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(["admin"]), async (req, res) => {
    const authReq = req;
    const admin = authReq.user;
    if (!admin) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { name, dob, address, residence, phone, grade, classLetter, schoolYear, major, // ✅ ngành
    studentId: frontendStudentId, } = req.body;
    // Kiểm tra các trường bắt buộc
    if (!name || !grade || !classLetter || !schoolYear || !major) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    try {
        // Tự sinh studentId nếu frontend không gửi
        let studentId = frontendStudentId;
        if (!studentId) {
            const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
            studentId = `${grade}${classLetter}${randomPart}`;
        }
        // Sinh classCode = khối + lớp + viết tắt ngành
        const classCode = (0, classCode_1.generateClassCode)(grade, classLetter, major);
        // Kiểm tra trùng studentId
        const existing = await User_1.default.findOne({ studentId });
        if (existing) {
            return res
                .status(400)
                .json({ message: "Mã học sinh đã tồn tại, thử lại" });
        }
        // Tạo học sinh mới
        const student = new User_1.default({
            username: name, // dùng username thay cho name
            dob,
            address,
            residence,
            phone,
            teacherId: "",
            grade,
            class: classLetter,
            schoolYear,
            studentId,
            role: "student",
            major, // ✅ lưu ngành
            classCode, // ✅ lưu mã lớp
            createdAt: new Date(),
        });
        await student.save();
        // ✅ Upsert ClassModel: nếu chưa có thì tạo, có rồi thì thêm student
        await Class_1.default.findOneAndUpdate({ classCode }, {
            $setOnInsert: {
                grade,
                classLetter,
                major,
            },
            $addToSet: { studentIds: studentId },
        }, { upsert: true, new: true });
        return res.status(201).json({
            message: "Tạo mã học sinh thành công",
            studentId: student.studentId,
            classCode,
        });
    }
    catch (err) {
        console.error("students/create error:", err);
        return res.status(500).json({ message: "Không thể tạo mã học sinh" });
    }
});
exports.default = router;
