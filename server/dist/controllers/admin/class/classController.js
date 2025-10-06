"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignTeacher = exports.addStudentToClass = exports.createOrGetClass = exports.getAllClasses = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Class_1 = __importDefault(require("../../../models/Class"));
const User_1 = __importDefault(require("../../../models/User"));
const teacherModel_1 = __importDefault(require("../../../models/teacherModel"));
/* ===== Lấy danh sách lớp (populate học sinh + giáo viên) ===== */
const getAllClasses = async (req, res) => {
    try {
        const classes = await Class_1.default.find()
            .populate({
            path: "studentIds",
            select: "studentId username major schoolYear classLetter",
        })
            .populate({
            path: "teacherId",
            select: "name subject majors",
        })
            .lean();
        const groupedByMajor = {};
        classes.forEach((cls) => {
            const major = cls.major || "Chưa có ngành";
            if (!groupedByMajor[major])
                groupedByMajor[major] = [];
            groupedByMajor[major].push({
                classCode: cls.classCode,
                className: cls.className,
                grade: cls.schoolYear,
                classLetter: cls.classLetter,
                teacher: cls.teacherId
                    ? {
                        id: cls.teacherId._id,
                        name: cls.teacherId.name,
                        subject: cls.teacherId.subject,
                    }
                    : null,
                students: cls.studentIds.map((s) => ({
                    studentId: s.studentId,
                    name: s.username,
                })),
            });
        });
        res.status(200).json(groupedByMajor);
    }
    catch (err) {
        console.error("⚠️ getAllClasses error:", err);
        res.status(500).json({ message: "Lấy danh sách lớp thất bại" });
    }
};
exports.getAllClasses = getAllClasses;
/* ===== Tạo hoặc lấy lớp ===== */
const createOrGetClass = async (req, res) => {
    try {
        const { schoolYear, classLetter, major, teacherId } = req.body;
        if (!major || !schoolYear || !classLetter) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
        }
        const majorAbbrev = major
            .split(/\s+/)
            .map((w) => w[0]?.toUpperCase() || "")
            .join("");
        const classCode = `${schoolYear}${classLetter}${majorAbbrev}`;
        const className = `${schoolYear}${classLetter} - ${major}`;
        let cls = await Class_1.default.findOne({ classCode, schoolYear, major });
        // Nếu chưa có -> tạo mới
        if (!cls) {
            cls = await Class_1.default.create({
                schoolYear,
                classLetter,
                major,
                classCode,
                className,
                teacherId: teacherId ? new mongoose_1.default.Types.ObjectId(teacherId) : null,
                teacherName: "",
                studentIds: [],
            });
        }
        // Nếu có teacherId mới => cập nhật
        if (teacherId &&
            (!cls.teacherId ||
                !cls.teacherId.equals(new mongoose_1.default.Types.ObjectId(teacherId)))) {
            const teacher = await teacherModel_1.default.findById(teacherId);
            cls.teacherId = new mongoose_1.default.Types.ObjectId(teacherId);
            cls.teacherName = teacher?.name || "";
            await cls.save();
            // Cập nhật teacherId cho toàn bộ học sinh trong lớp
            if (cls.studentIds.length > 0) {
                await User_1.default.updateMany({ _id: { $in: cls.studentIds } }, { $set: { teacherId: cls.teacherId } });
            }
        }
        res.status(200).json(cls);
    }
    catch (err) {
        console.error("⚠️ createOrGetClass error:", err);
        res.status(500).json({ message: "Tạo hoặc lấy lớp thất bại" });
    }
};
exports.createOrGetClass = createOrGetClass;
/* ===== Thêm học sinh vào lớp ===== */
const addStudentToClass = async (req, res) => {
    try {
        const { studentId } = req.body;
        if (!studentId) {
            return res.status(400).json({ message: "Thiếu thông tin học sinh" });
        }
        const student = await User_1.default.findById(studentId).lean();
        if (!student) {
            return res.status(404).json({ message: "Không tìm thấy học sinh" });
        }
        const majorAbbrev = (student.major || "")
            .split(/\s+/)
            .map((w) => w[0]?.toUpperCase() || "")
            .join("");
        const classCode = `${student.schoolYear}${student.classLetter}${majorAbbrev}`;
        const className = `${student.schoolYear}${student.classLetter} - ${student.major}`;
        let cls = await Class_1.default.findOne({
            classCode,
            schoolYear: student.schoolYear,
            major: student.major,
        });
        // Nếu chưa có lớp => tạo
        if (!cls) {
            cls = await Class_1.default.create({
                schoolYear: student.schoolYear,
                classLetter: student.classLetter,
                major: student.major,
                classCode,
                className,
                teacherId: null,
                teacherName: "",
                studentIds: [],
            });
        }
        const studentObjectId = new mongoose_1.default.Types.ObjectId(studentId);
        if (!cls.studentIds.some((id) => id.equals(studentObjectId))) {
            cls.studentIds.push(studentObjectId);
            await cls.save();
        }
        // Nếu lớp có giáo viên thì set luôn cho học sinh
        if (cls.teacherId) {
            await User_1.default.updateOne({ _id: studentObjectId }, { $set: { teacherId: cls.teacherId } });
        }
        const populated = await Class_1.default.findById(cls._id)
            .populate({
            path: "studentIds",
            select: "studentId username major schoolYear classLetter",
        })
            .populate({
            path: "teacherId",
            select: "name subject majors",
        });
        res.status(200).json(populated);
    }
    catch (err) {
        console.error("⚠️ addStudentToClass error:", err);
        res.status(500).json({ message: "Thêm học sinh thất bại" });
    }
};
exports.addStudentToClass = addStudentToClass;
/* ===== Gán giáo viên cho lớp ===== */
const assignTeacher = async (req, res) => {
    try {
        const { classCode } = req.params;
        const { teacherId } = req.body;
        if (!teacherId) {
            return res.status(400).json({ message: "teacherId là bắt buộc" });
        }
        const teacher = await teacherModel_1.default.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: "Không tìm thấy giáo viên" });
        }
        const match = classCode.match(/^(\d{4})([A-Za-z])([A-Z]+)$/);
        let schoolYear = "";
        let classLetter = "";
        let major = "";
        if (match) {
            const [, year, letter, maj] = match;
            schoolYear = year;
            classLetter = letter;
            major = maj;
        }
        else if (teacher.majors?.length) {
            major = teacher.majors[0];
        }
        const className = `${schoolYear}${classLetter} - ${major}`;
        let cls = await Class_1.default.findOne({ classCode, schoolYear, major });
        if (!cls) {
            cls = await Class_1.default.create({
                schoolYear,
                classLetter,
                major,
                classCode,
                className,
                teacherId,
                teacherName: teacher.name,
                studentIds: [],
            });
        }
        else {
            cls.teacherId = new mongoose_1.default.Types.ObjectId(teacherId);
            cls.teacherName = teacher.name;
            if (!cls.schoolYear)
                cls.schoolYear = schoolYear;
            if (!cls.classLetter)
                cls.classLetter = classLetter;
            if (!cls.major)
                cls.major = major;
            await cls.save();
        }
        if (cls.studentIds.length > 0) {
            await User_1.default.updateMany({ _id: { $in: cls.studentIds } }, { $set: { teacherId } });
        }
        res.status(200).json(cls);
    }
    catch (err) {
        console.error("⚠️ assignTeacher error:", err);
        res.status(500).json({ message: "Gán giáo viên thất bại" });
    }
};
exports.assignTeacher = assignTeacher;
