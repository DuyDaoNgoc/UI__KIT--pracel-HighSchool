"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeachers = exports.createTeacher = void 0;
const teacherModel_1 = __importDefault(require("../../../models/teacherModel"));
// Tạo mới giáo viên
const createTeacher = async (req, res) => {
    try {
        const teacherData = {
            ...req.body,
            gender: req.body.gender || "male", // ✅ ép kiểu
        };
        const newTeacher = new teacherModel_1.default(teacherData);
        await newTeacher.save();
        res.status(201).json({ success: true, data: newTeacher });
    }
    catch (error) {
        console.error("❌ Lỗi tạo giáo viên:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.createTeacher = createTeacher;
// Lấy danh sách giáo viên
const getTeachers = async (req, res) => {
    try {
        const teachers = await teacherModel_1.default.find();
        res.status(200).json({ success: true, data: teachers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTeachers = getTeachers;
