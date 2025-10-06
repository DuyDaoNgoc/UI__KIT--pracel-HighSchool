"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacherModel_1 = __importDefault(require("../../models/teacherModel"));
const createTeacher_1 = require("../../controllers/admin/teacher/createTeacher");
const router = (0, express_1.Router)();
// 📌 Lấy danh sách giáo viên
router.get("/", async (req, res, next) => {
    try {
        const teachers = await teacherModel_1.default.find();
        res.json(teachers);
    }
    catch (err) {
        next(err);
    }
});
// 📌 Thêm giáo viên mới (dùng controller có auto teacherId)
router.post("/", createTeacher_1.createTeacher);
// 📌 Sửa thông tin giáo viên
router.put("/:id", async (req, res, next) => {
    try {
        const teacher = await teacherModel_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!teacher) {
            return res.status(404).json({ message: "Không tìm thấy giáo viên" });
        }
        res.json(teacher);
    }
    catch (err) {
        next(err);
    }
});
// 📌 Xóa giáo viên
router.delete("/:id", async (req, res, next) => {
    try {
        const teacher = await teacherModel_1.default.findByIdAndDelete(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: "Không tìm thấy giáo viên" });
        }
        res.json({ message: "Đã xóa giáo viên" });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
