"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAdmin = ensureAdmin;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function ensureAdmin(db) {
    const adminEmail = "admin@example.com";
    const existing = await db
        .collection("users")
        .findOne({ email: adminEmail });
    if (existing)
        return;
    const hashedPassword = await bcryptjs_1.default.hash("admin123", 10);
    await db.collection("users").insertOne({
        username: "admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png", // ✅ thêm avatar mặc định
        createdAt: new Date(),
    });
}
