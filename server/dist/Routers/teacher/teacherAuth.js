"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/Routers/teacherAuth.ts
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const User_1 = __importDefault(require("../../models/User")); // Model người dùng (bao gồm học sinh)
const registerTeacher_1 = require("../../controllers/admin/teacher/registerTeacher"); // controller mới
const router = (0, express_1.Router)();
// ===== Đăng ký giáo viên =====
router.post("/register", async (req, res) => {
    await (0, registerTeacher_1.createTeacher)(req, res);
});
// ===== Lấy danh sách học sinh của giáo viên =====
const getStudents = async (req, res) => {
    const authReq = req;
    const teacher = authReq.user;
    if (!teacher || !teacher._id) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        // Tìm học sinh theo teacherId
        const students = await User_1.default.find({
            role: "student",
            teacherId: teacher._id.toString(),
        }).select("_id username class grades");
        const response = students
            .filter((s) => s._id) // loại bỏ trường hợp _id undefined
            .map((s) => ({
            _id: s._id.toString(),
            username: s.username,
            class: s.class || "Chưa có lớp",
            lastGrade: s.grades?.length
                ? s.grades[s.grades.length - 1].score
                : undefined,
        }));
        return res.status(200).json(response);
    }
    catch (err) {
        console.error("❌ Lỗi lấy dữ liệu học sinh:", err);
        return res.status(500).json({ message: "Lỗi server" });
    }
};
router.get("/students", authMiddleware_1.verifyToken, authMiddleware_1.requireTeacher, getStudents);
// ===== Lấy trạng thái khóa điểm =====
const getGradesLockStatus = async (_req, res) => {
    try {
        const { connectDB } = await Promise.resolve().then(() => __importStar(require("../../configs/db"))); // không dùng .default
        const db = await connectDB();
        const settings = db.collection("settings");
        const lockDoc = await settings.findOne({ _id: "gradesLockStatus" });
        return res.status(200).json({ locked: lockDoc?.locked ?? false });
    }
    catch (err) {
        console.error("❌ GET /grades/status teacher error:", err);
        return res
            .status(500)
            .json({ message: "Lỗi lấy trạng thái khóa điểm", error: err });
    }
};
router.get("/grades/status", authMiddleware_1.verifyToken, authMiddleware_1.requireTeacher, getGradesLockStatus);
exports.default = router;
