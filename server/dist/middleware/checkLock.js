"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkGradesLock = checkGradesLock;
const db_1 = require("../configs/db");
async function checkGradesLock(req, res, next) {
    try {
        const db = await (0, db_1.connectDB)();
        const settings = db.collection("settings");
        const lockDoc = await settings.findOne({ _id: "gradesLockStatus" });
        if (lockDoc?.locked) {
            return res
                .status(403)
                .json({ message: "❌ Hệ thống đã khoá điểm, không thể chỉnh sửa" });
        }
        next();
    }
    catch (err) {
        console.error("❌ checkGradesLock error:", err);
        res.status(500).json({ message: "Lỗi server" });
    }
}
