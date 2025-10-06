"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignTeacherToClass = void 0;
const teacherModel_1 = __importDefault(require("../../../models/teacherModel"));
const Class_1 = __importDefault(require("../../../models/Class"));
const assignTeacherToClass = async (req, res) => {
    try {
        const { teacherId, classCode } = req.body;
        const foundClass = await Class_1.default.findOne({ classCode });
        if (!foundClass) {
            return res.status(404).json({ message: "Class not found" });
        }
        const teacher = await teacherModel_1.default.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        // Tạo tên lớp gộp từ schema có sẵn
        const className = `${foundClass.grade}${foundClass.classLetter} - ${foundClass.major} (${foundClass.schoolYear})`;
        // gán giáo viên vào lớp
        foundClass.teacherId = teacher._id;
        foundClass.teacherName = teacher.name; // teacher có field name
        await foundClass.save();
        // cập nhật trong Teacher (nếu schema hỗ trợ)
        teacher.assignedClass = {
            classCode: foundClass.classCode,
            className,
            grade: foundClass.grade,
            classLetter: foundClass.classLetter,
            schoolYear: foundClass.schoolYear,
            major: foundClass.major,
        };
        await teacher.save();
        res.json({
            message: "Assign teacher to class success",
            data: {
                teacher: teacher.name,
                class: className,
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};
exports.assignTeacherToClass = assignTeacherToClass;
