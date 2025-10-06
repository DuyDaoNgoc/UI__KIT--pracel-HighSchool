"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.getAllUsers = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongodb_1 = require("mongodb");
const User_1 = require("../models/User");
const db_1 = require("../configs/db");
const user_1 = require("../types/user");
// ===================== REGISTER =====================
const registerUser = async (req, res) => {
    try {
        const { studentCode, teacherCode, email, password } = req.body;
        if (!studentCode && !teacherCode) {
            return res.status(400).json({
                success: false,
                message: "❌ Missing field: studentCode or teacherCode",
            });
        }
        if (!email) {
            return res
                .status(400)
                .json({ success: false, message: "❌ Missing field: email" });
        }
        if (!password) {
            return res
                .status(400)
                .json({ success: false, message: "❌ Missing field: password" });
        }
        const db = await (0, db_1.connectDB)();
        let targetUserData = null;
        let role = "student";
        if (studentCode) {
            targetUserData = await db
                .collection("students")
                .findOne({ studentId: studentCode });
            role = "student";
            if (!targetUserData) {
                return res
                    .status(404)
                    .json({ success: false, message: "❌ Student code not found" });
            }
        }
        if (teacherCode) {
            targetUserData = await db
                .collection("teachers")
                .findOne({ teacherId: teacherCode });
            role = "teacher";
            if (!targetUserData) {
                return res
                    .status(404)
                    .json({ success: false, message: "❌ Teacher code not found" });
            }
        }
        const existingEmail = await User_1.User.findOne({ email });
        if (existingEmail) {
            return res
                .status(400)
                .json({ success: false, message: "❌ Email already registered" });
        }
        const existingUser = await User_1.User.findOne({
            $or: [
                { studentId: targetUserData?.studentId || null },
                { teacherId: targetUserData?.teacherId || null },
            ],
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "❌ This account has already been created",
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUserData = {
            username: targetUserData.name ||
                targetUserData.teacherId ||
                targetUserData.studentId ||
                "Unknown",
            email,
            password: hashedPassword,
            role,
            studentId: targetUserData.studentId || "",
            teacherId: targetUserData.teacherId || "",
            parentId: targetUserData.parentId || "",
            classCode: targetUserData.classCode || targetUserData.classLetter || "",
            major: targetUserData.major || targetUserData.majors || "",
            schoolYear: targetUserData.schoolYear || "",
            dob: targetUserData.dob || new Date("2000-01-01"),
            grade: targetUserData.grade || "",
            phone: targetUserData.phone || "",
            address: targetUserData.address || "",
            residence: targetUserData.residence || "",
            avatar: targetUserData.avatar ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            children: [],
            loginAttempts: 0,
            lockUntil: 0,
            createdAt: new Date(),
        };
        const newUser = await User_1.User.create(newUserData);
        return res.status(201).json({
            success: true,
            message: "✅ User registered successfully",
            user: (0, user_1.toSafeUser)(newUser),
        });
    }
    catch (err) {
        console.error("Register error:", err);
        return res.status(500).json({ success: false, message: "❌ Server error" });
    }
};
exports.registerUser = registerUser;
// ===================== LOGIN =====================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            return res
                .status(400)
                .json({ success: false, message: "❌ Missing field: email" });
        }
        if (!password) {
            return res
                .status(400)
                .json({ success: false, message: "❌ Missing field: password" });
        }
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: "❌ Invalid email or password" });
        }
        const now = Date.now();
        if (user.lockUntil && user.lockUntil > now) {
            const secondsLeft = Math.ceil((user.lockUntil - now) / 1000);
            return res.status(403).json({
                success: false,
                message: `Tài khoản bị khóa. Thử lại sau ${secondsLeft} giây`,
                lockTime: secondsLeft,
            });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password || "");
        if (!isMatch) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            if (user.loginAttempts > 4) {
                const lockSeconds = Math.pow(2, user.loginAttempts - 4) * 10;
                user.lockUntil = now + lockSeconds * 1000;
            }
            await User_1.User.updateOne({ _id: user._id }, { loginAttempts: user.loginAttempts, lockUntil: user.lockUntil });
            return res.status(401).json({
                success: false,
                message: "❌ Invalid email or password",
                attemptsLeft: Math.max(0, 4 - user.loginAttempts),
                lockTime: user.lockUntil ? Math.ceil((user.lockUntil - now) / 1000) : 0,
            });
        }
        await User_1.User.updateOne({ _id: user._id }, { loginAttempts: 0, lockUntil: 0 });
        const token = jsonwebtoken_1.default.sign({
            id: user._id.toString(),
            role: user.role,
            email: user.email,
            studentId: user.studentId,
            teacherId: user.teacherId,
            parentId: user.parentId,
        }, process.env.JWT_SECRET);
        return res.json({
            success: true,
            message: "✅ Login successful",
            token,
            user: (0, user_1.toSafeUser)(user),
        });
    }
    catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: "❌ Server error" });
    }
};
exports.loginUser = loginUser;
// ===================== GET ALL USERS =====================
const getAllUsers = async (req, res) => {
    try {
        const db = await (0, db_1.connectDB)();
        const students = db.collection("students");
        const teachers = db.collection("teachers");
        // lấy users từ mongoose (lean trả object thuần)
        const users = await User_1.User.find().lean();
        const result = await Promise.all(users.map(async (u) => {
            const safeUser = (0, user_1.toSafeUser)(u);
            // --- Hàm phụ: lấy string từ nhiều kiểu field ---
            const extractClassString = (obj) => {
                if (!obj)
                    return "";
                if (typeof obj === "string")
                    return obj;
                if (typeof obj === "object") {
                    return (obj.className ||
                        obj.class ||
                        obj.classCode ||
                        obj.classLetter ||
                        "");
                }
                return "";
            };
            const extractMajorString = (obj) => {
                if (!obj)
                    return "";
                if (typeof obj === "string")
                    return obj;
                if (Array.isArray(obj))
                    return obj.join(", ");
                if (typeof obj === "object")
                    return (obj.name ||
                        (obj.majors
                            ? Array.isArray(obj.majors)
                                ? obj.majors.join(", ")
                                : obj.majors
                            : ""));
                return "";
            };
            // 1) ưu tiên lấy từ chính document user
            let classStr = "";
            let majorStr = "";
            // user có thể chứa classCode (string/object), class, classLetter,...
            classStr =
                extractClassString(u.classCode) ||
                    extractClassString(u.class) ||
                    extractClassString(u.classLetter);
            majorStr =
                extractMajorString(u.major) || extractMajorString(u.majors);
            // 2) nếu thiếu, fallback sang students/teachers collection theo role
            if ((!classStr || !majorStr) && u.role === "student" && u.studentId) {
                const student = await students.findOne({ studentId: u.studentId });
                if (student) {
                    classStr =
                        classStr ||
                            student.classCode ||
                            student.class ||
                            student.classLetter ||
                            "";
                    majorStr =
                        majorStr ||
                            student.major ||
                            (Array.isArray(student.majors)
                                ? student.majors.join(", ")
                                : student.majors || "");
                }
            }
            if ((!classStr || !majorStr) && u.role === "teacher" && u.teacherId) {
                const teacher = await teachers.findOne({ teacherId: u.teacherId });
                if (teacher) {
                    classStr =
                        classStr ||
                            teacher.classCode ||
                            teacher.class ||
                            teacher.className ||
                            "";
                    majorStr =
                        majorStr ||
                            teacher.major ||
                            (Array.isArray(teacher.majors)
                                ? teacher.majors.join(", ")
                                : teacher.majors || "");
                }
            }
            // normalize thành object (frontend hiện tại của bạn có thể nhận object)
            const classObj = classStr
                ? { className: classStr, grade: u.grade || "" }
                : null;
            const majorObj = majorStr
                ? { name: majorStr, code: u.majorCode || "" }
                : null;
            return {
                ...safeUser,
                // giữ tên field giống bạn đang dùng: classCode + major
                classCode: classObj,
                major: majorObj,
                role: u.role,
            };
        }));
        res.status(200).json(result);
    }
    catch (err) {
        console.error("GetAllUsers error:", err);
        res.status(500).json({ success: false, message: "❌ Server error" });
    }
};
exports.getAllUsers = getAllUsers;
// ===================== DELETE USER =====================
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongodb_1.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "❌ Invalid ID" });
        }
        const deletedUser = await User_1.User.findByIdAndDelete(new mongodb_1.ObjectId(id));
        if (!deletedUser) {
            return res
                .status(404)
                .json({ success: false, message: "❌ User not found" });
        }
        res
            .status(200)
            .json({ success: true, message: "✅ User deleted successfully" });
    }
    catch (err) {
        console.error("DeleteUser error:", err);
        res.status(500).json({ success: false, message: "❌ Server error" });
    }
};
exports.deleteUser = deleteUser;
