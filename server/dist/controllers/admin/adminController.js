"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLockStatus = getLockStatus;
exports.lockGrades = lockGrades;
exports.unlockGrades = unlockGrades;
const db_1 = require("../../configs/db");
/**
 * GET /api/admin/grades/status
 * Trả về { locked: boolean }
 */
async function getLockStatus(req, res) {
    try {
        const db = await (0, db_1.connectDB)();
        const settings = db.collection("app_settings");
        const doc = await settings.findOne({ key: "grades_locked" });
        const locked = !!doc?.value;
        return res.json({ locked });
    }
    catch (err) {
        console.error("❌ getLockStatus error:", err);
        return res.status(500).json({ message: "Failed to get lock status" });
    }
}
/**
 * POST /api/admin/grades/lock
 * Đặt khóa = true
 */
async function lockGrades(req, res) {
    try {
        const db = await (0, db_1.connectDB)();
        const settings = db.collection("app_settings");
        await settings.updateOne({ key: "grades_locked" }, { $set: { value: true, updatedAt: new Date() } }, { upsert: true });
        return res.json({ locked: true });
    }
    catch (err) {
        console.error("❌ lockGrades error:", err);
        return res.status(500).json({ message: "Failed to lock grades" });
    }
}
/**
 * POST /api/admin/grades/unlock
 * Đặt khóa = false
 */
async function unlockGrades(req, res) {
    try {
        const db = await (0, db_1.connectDB)();
        const settings = db.collection("app_settings");
        await settings.updateOne({ key: "grades_locked" }, { $set: { value: false, updatedAt: new Date() } }, { upsert: true });
        return res.json({ locked: false });
    }
    catch (err) {
        console.error("❌ unlockGrades error:", err);
        return res.status(500).json({ message: "Failed to unlock grades" });
    }
}
