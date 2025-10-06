"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.createUser = createUser;
exports.updateUserById = updateUserById;
const db_1 = require("../../configs/db");
const user_1 = require("../../types/user");
const mongodb_1 = require("mongodb");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// ===================== Tìm user theo email =====================
async function findUserByEmail(email) {
    const db = await (0, db_1.connectDB)();
    return db.collection("users").findOne({ email });
}
// ===================== Tạo user mới =====================
async function createUser(input) {
    if (!input.password)
        throw new Error("Password is required");
    const db = await (0, db_1.connectDB)();
    const hashedPassword = await bcryptjs_1.default.hash(input.password, 10);
    const newUser = {
        studentId: input.studentId ?? "",
        teacherId: input.teacherId ?? "",
        parentId: input.parentId ?? null,
        customId: input.customId ?? "",
        username: input.username,
        email: input.email,
        password: hashedPassword,
        role: input.role ?? (input.teacherId ? "teacher" : "student"),
        // 🧩 DỮ LIỆU HỌC SINH / GIÁO VIÊN BỔ SUNG
        dob: input.dob ?? "", // Ngày sinh
        grade: input.grade ?? "", // Khối (VD: 1)
        class: input.class ?? "", // Lớp (VD: A)
        major: input.major ?? "", // Ngành học (CNTT,...)
        classCode: input.classCode ?? "", // VD: 1ACNTT
        schoolYear: input.schoolYear ?? "", // VD: 2024-2025
        phone: input.phone ?? "",
        address: input.address ?? "",
        location: input.location ?? "", // VD: Đà Nẵng
        avatar: input.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
        // 🧩 Giữ nguyên phần cũ
        children: (input.children ?? []).map((id) => new mongodb_1.ObjectId(id)),
        grades: input.grades ?? [],
        creditsTotal: input.creditsTotal ?? 0,
        creditsEarned: input.creditsEarned ?? 0,
        schedule: input.schedule ?? [],
        tuitionTotal: input.tuitionTotal ?? 0,
        tuitionPaid: input.tuitionPaid ?? 0,
        tuitionRemaining: input.tuitionRemaining ?? 0,
        // Trường để quản lý khóa login
        loginAttempts: 0,
        lockUntil: 0,
    };
    const result = await db.collection("users").insertOne(newUser);
    const userWithId = {
        ...newUser,
        _id: result.insertedId,
    };
    return (0, user_1.toSafeUser)(userWithId);
}
// ===================== Cập nhật user theo ID =====================
async function updateUserById(id, update) {
    const db = await (0, db_1.connectDB)();
    const _id = typeof id === "string" ? new mongodb_1.ObjectId(id) : id;
    await db.collection("users").updateOne({ _id }, { $set: update });
}
