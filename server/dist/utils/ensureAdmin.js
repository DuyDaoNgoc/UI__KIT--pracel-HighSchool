"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAdmin = ensureAdmin;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function ensureAdmin(db) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const existing = await db
        .collection("users")
        .findOne({ email: adminEmail });
    if (existing)
        return;
    const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 10);
    await db.collection("users").insertOne({
        username: "admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        createdAt: new Date(),
    });
    console.log("✅ Admin created:", adminEmail);
}
