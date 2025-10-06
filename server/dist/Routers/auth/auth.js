"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const registerUser_1 = require("../../controllers/registerUser");
const userController_1 = require("../../controllers/userController");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const db_1 = require("../../configs/db");
const mongodb_1 = require("mongodb");
const router = (0, express_1.Router)();
// ===================== REGISTER =====================
router.post("/register", registerUser_1.registerUser);
// ===================== LOGIN =====================
router.post("/login", userController_1.loginUser);
// ===================== GET CURRENT USER =====================
router.get("/me", authMiddleware_1.verifyToken, (async (req, res) => {
    try {
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, message: "❌ Unauthorized" });
        }
        const db = await (0, db_1.connectDB)();
        const users = db.collection("users");
        // Lấy user theo ObjectId
        const user = await users.findOne({ _id: new mongodb_1.ObjectId(req.user.id) }, {
            projection: {
                _id: 1,
                studentId: 1,
                teacherId: 1, // thêm teacherId
                username: 1,
                email: 1,
                role: 1,
            },
        });
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "❌ User not found" });
        }
        let finalUsername = user.username;
        // Nếu là học sinh, ưu tiên lấy tên thật từ students
        if (user.role === "student" && user.studentId) {
            const students = db.collection("students");
            const student = await students.findOne({ studentId: user.studentId }, { projection: { name: 1 } });
            if (student?.name) {
                finalUsername = student.name;
            }
        }
        // Nếu là giáo viên, ưu tiên lấy tên thật từ teachers
        if (user.role === "teacher" && user.teacherId) {
            const teachers = db.collection("teachers");
            const teacher = await teachers.findOne({ teacherId: user.teacherId }, { projection: { name: 1 } });
            if (teacher?.name) {
                finalUsername = teacher.name;
            }
        }
        return res.json({
            success: true,
            user: {
                id: user._id,
                studentId: user.studentId || null,
                teacherId: user.teacherId || null,
                username: finalUsername,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error("GET /me error:", err);
        return res.status(500).json({ success: false, message: "❌ Server error" });
    }
}));
// ===================== ADMIN ROUTE =====================
router.get("/admin", authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(["admin"]), ((req, res) => {
    res.json({
        success: true,
        message: "✅ Welcome Admin!",
        user: req.user,
    });
}));
exports.default = router;
