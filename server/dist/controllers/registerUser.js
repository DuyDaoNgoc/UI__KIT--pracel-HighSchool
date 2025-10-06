"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../configs/db");
const registerUser = async (req, res) => {
    try {
        const { studentCode, teacherCode, email, password } = req.body;
        // ===== Validate input =====
        if (!studentCode && !teacherCode) {
            return res.status(400).json({
                success: false,
                field: "code",
                message: "Student code or Teacher code is required",
            });
        }
        if (!email) {
            return res.status(400).json({
                success: false,
                field: "email",
                message: "Email is required",
            });
        }
        if (!password) {
            return res.status(400).json({
                success: false,
                field: "password",
                message: "Password is required",
            });
        }
        const db = await (0, db_1.connectDB)();
        const users = db.collection("users");
        const students = db.collection("students");
        const teachers = db.collection("teachers");
        // ===== Check email đã tồn tại =====
        const existingUser = await users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                field: "email",
                message: "Email already registered",
            });
        }
        let newUser;
        if (studentCode) {
            // ===== Lấy học sinh =====
            const student = await students.findOne({ studentId: studentCode });
            if (!student) {
                return res.status(404).json({
                    success: false,
                    field: "studentCode",
                    message: "Student code not found",
                });
            }
            // ===== Kiểm tra đã tạo user chưa =====
            const existingStudentUser = await users.findOne({
                studentId: student.studentId,
            });
            if (existingStudentUser) {
                return res.status(400).json({
                    success: false,
                    field: "studentCode",
                    message: "This student code is already linked to an account",
                });
            }
            // ===== Hash password =====
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            // ===== Xử lý classCode & major cho student =====
            const safeClassCode = student.classCode ||
                `${student.grade || ""}${student.classLetter || ""}`.trim();
            const safeMajor = student.major || student.faculty || "";
            newUser = {
                customId: crypto_1.default.randomBytes(6).toString("hex"),
                username: student.name || student.studentId,
                studentId: student.studentId,
                email,
                password: hashedPassword,
                role: "student",
                classCode: safeClassCode,
                major: safeMajor,
                createdAt: new Date(),
            };
        }
        else if (teacherCode) {
            // ===== Lấy giáo viên =====
            const teacher = await teachers.findOne({ teacherId: teacherCode });
            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    field: "teacherCode",
                    message: "Teacher code not found",
                });
            }
            // ===== Kiểm tra đã tạo user chưa =====
            const existingTeacherUser = await users.findOne({
                teacherId: teacher.teacherId,
            });
            if (existingTeacherUser) {
                return res.status(400).json({
                    success: false,
                    field: "teacherCode",
                    message: "This teacher code is already linked to an account",
                });
            }
            // ===== Hash password =====
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            // ===== Xử lý major của giáo viên =====
            let teacherMajor = "";
            if (Array.isArray(teacher.majors) && teacher.majors.length > 0) {
                teacherMajor = teacher.majors.join(", ");
            }
            else if (teacher.major) {
                teacherMajor = teacher.major;
            }
            newUser = {
                customId: crypto_1.default.randomBytes(6).toString("hex"),
                username: teacher.name || teacher.teacherId,
                teacherId: teacher.teacherId,
                email,
                password: hashedPassword,
                role: "teacher",
                classCode: teacher.classCode || "",
                major: teacherMajor,
                createdAt: new Date(),
            };
        }
        // ===== Insert user =====
        const result = await users.insertOne(newUser);
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: result.insertedId,
                username: newUser.username,
                studentId: newUser.studentId,
                teacherId: newUser.teacherId,
                email: newUser.email,
                role: newUser.role,
                classCode: newUser.classCode,
                major: newUser.major,
            },
        });
    }
    catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: err instanceof Error ? err.message : err,
        });
    }
};
exports.registerUser = registerUser;
