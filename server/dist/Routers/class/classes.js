"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/Routers/classes.ts
const express_1 = require("express");
const Class_1 = __importDefault(require("../../models/Class"));
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * GET all classes
 */
router.get("/", authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(["admin"]), async (req, res) => {
    try {
        const classes = await Class_1.default.find();
        return res.status(200).json({ success: true, data: classes });
    }
    catch (err) {
        console.error("⚠️ fetch classes error:", err);
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách lớp",
        });
    }
});
/**
 * CREATE class (hoặc lấy nếu đã tồn tại)
 */
router.post("/create", authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(["admin"]), async (req, res) => {
    try {
        const { schoolYear, classLetter, major, classCode } = req.body;
        if (!schoolYear || !classLetter || !classCode) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin lớp",
            });
        }
        let cls = await Class_1.default.findOne({ classCode });
        if (!cls) {
            cls = new Class_1.default({
                schoolYear,
                classLetter,
                major: major ?? "",
                classCode,
                teacherName: "",
                studentIds: [],
            });
            await cls.save();
        }
        return res.status(201).json({ success: true, data: cls });
    }
    catch (err) {
        console.error("⚠️ create class error:", err);
        return res.status(500).json({
            success: false,
            message: "Không thể tạo lớp",
        });
    }
});
/**
 * ASSIGN teacher to class (tự tạo lớp nếu chưa tồn tại)
 */
router.post("/:classCode/assign-teacher", authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(["admin"]), async (req, res) => {
    try {
        const { classCode } = req.params;
        const { teacherName, schoolYear, classLetter, major } = req.body;
        if (!teacherName) {
            return res.status(400).json({
                success: false,
                message: "Thiếu tên giáo viên",
            });
        }
        let cls = await Class_1.default.findOne({ classCode });
        if (!cls) {
            if (!schoolYear || !classLetter) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu schoolYear hoặc classLetter để tạo lớp",
                });
            }
            cls = new Class_1.default({
                schoolYear,
                classLetter,
                major: major ?? "",
                classCode,
                teacherName,
                studentIds: [],
            });
            await cls.save();
        }
        else {
            cls.teacherName = teacherName;
            await cls.save();
        }
        return res.status(200).json({ success: true, data: cls });
    }
    catch (err) {
        console.error("⚠️ assign teacher error:", err);
        return res.status(500).json({
            success: false,
            message: "Gán giáo viên thất bại",
        });
    }
});
/**
 * ADD student to class (tự tạo lớp nếu chưa tồn tại)
 */
router.post("/:classCode/add-student", authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(["admin"]), async (req, res) => {
    try {
        const { classCode } = req.params;
        const { studentId, schoolYear, classLetter, major } = req.body;
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu studentId",
            });
        }
        let cls = await Class_1.default.findOne({ classCode });
        if (!cls) {
            if (!schoolYear || !classLetter) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu schoolYear hoặc classLetter để tạo lớp",
                });
            }
            cls = new Class_1.default({
                schoolYear,
                classLetter,
                major: major ?? "",
                classCode,
                teacherName: "",
                studentIds: [studentId],
            });
            await cls.save();
        }
        else {
            cls.studentIds = cls.studentIds || [];
            if (!cls.studentIds.includes(studentId)) {
                cls.studentIds.push(studentId);
                await cls.save();
            }
        }
        return res.status(200).json({ success: true, data: cls });
    }
    catch (err) {
        console.error("⚠️ add student error:", err);
        return res.status(500).json({
            success: false,
            message: "Thêm học sinh thất bại",
        });
    }
});
exports.default = router;
