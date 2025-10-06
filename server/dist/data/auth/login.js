"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = loginUser;
const userService_1 = require("./userService");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function loginUser(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "Missing email or password" });
        // --- 1. Admin login ---
        if (email === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD) {
            const token = jsonwebtoken_1.default.sign({ id: "admin", email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
            return res.status(200).json({
                message: "Login successful",
                token,
                user: {
                    id: "admin",
                    username: "Administrator",
                    role: "admin",
                    email,
                    teacherId: null,
                    parentId: null,
                },
            });
        }
        // --- 2. User login ---
        const user = (await (0, userService_1.findUserByEmail)(email));
        if (!user || !user.password)
            return res.status(401).json({ message: "Invalid email or password" });
        const now = Date.now();
        // --- Kiểm tra lock ---
        if (user.lockUntil && user.lockUntil > now) {
            const secondsLeft = Math.ceil((user.lockUntil - now) / 1000);
            return res.status(403).json({
                message: `Tài khoản bị khóa. Thử lại sau ${secondsLeft} giây`,
                lockTime: secondsLeft,
            });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            // --- Login sai ---
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            // Tính thời gian khóa nếu vượt quá 4 lần
            if (user.loginAttempts > 4) {
                const lockSeconds = Math.pow(2, user.loginAttempts - 4) * 10; // khóa tăng dần
                user.lockUntil = now + lockSeconds * 1000;
            }
            // Cập nhật DB
            await (0, userService_1.updateUserById)(user._id, {
                loginAttempts: user.loginAttempts,
                lockUntil: user.lockUntil,
            });
            return res.status(401).json({
                message: "Invalid email or password",
                attemptsLeft: Math.max(0, 4 - user.loginAttempts),
                lockTime: user.lockUntil ? Math.ceil((user.lockUntil - now) / 1000) : 0,
            });
        }
        // --- Login thành công: reset loginAttempts và lockUntil ---
        await (0, userService_1.updateUserById)(user._id, { loginAttempts: 0, lockUntil: 0 });
        // --- JWT ---
        const token = jsonwebtoken_1.default.sign({ id: user._id.toString(), email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
        // --- Safe user ---
        const safeUser = {
            _id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
            dob: user.dob,
            class: user.class,
            schoolYear: user.schoolYear,
            phone: user.phone,
            address: user.address,
            avatar: user.avatar,
            createdAt: user.createdAt || new Date(),
            teacherId: user.teacherId ?? null,
            parentId: user.parentId ?? null,
            children: user.children || [],
            grades: user.grades || [],
            creditsTotal: user.creditsTotal || 0,
            creditsEarned: user.creditsEarned || 0,
            schedule: user.schedule || [],
            tuitionTotal: user.tuitionTotal || 0,
            tuitionPaid: user.tuitionPaid || 0,
            tuitionRemaining: user.tuitionRemaining || 0,
        };
        return res.status(200).json({
            message: "Login successful",
            token,
            user: safeUser,
        });
    }
    catch (err) {
        console.error("loginUser error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}
