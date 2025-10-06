"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../../configs/db");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// ==============================
// GET /api/news/pending
// ==============================
router.get("/pending", authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(["admin"]), async (_req, res) => {
    try {
        const db = await (0, db_1.connectDB)();
        const newsCollection = db.collection("news");
        const items = await newsCollection.find({ status: "pending" }).toArray();
        // Trả về mảng rỗng nếu không có
        res.json(items);
    }
    catch (err) {
        console.error("news/pending error:", err);
        res.status(500).json({ message: "Failed to fetch pending news" });
    }
});
// ==============================
// POST /api/news/:id/approve
// ==============================
router.post("/:id/approve", authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(["admin"]), async (req, res) => {
    try {
        const id = Number(req.params.id);
        const db = await (0, db_1.connectDB)();
        const newsCollection = db.collection("news");
        const r = await newsCollection.updateOne({ id }, { $set: { status: "approved", updatedAt: new Date() } });
        if (!r.matchedCount)
            return res.status(404).json({ message: "News not found" });
        res.json({ ok: true });
    }
    catch (err) {
        console.error("news/approve error:", err);
        res.status(500).json({ message: "Failed to approve news" });
    }
});
// ==============================
// POST /api/news/:id/reject
// ==============================
router.post("/:id/reject", authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(["admin"]), async (req, res) => {
    try {
        const id = Number(req.params.id);
        const db = await (0, db_1.connectDB)();
        const newsCollection = db.collection("news");
        const r = await newsCollection.updateOne({ id }, { $set: { status: "rejected", updatedAt: new Date() } });
        if (!r.matchedCount)
            return res.status(404).json({ message: "News not found" });
        res.json({ ok: true });
    }
    catch (err) {
        console.error("news/reject error:", err);
        res.status(500).json({ message: "Failed to reject news" });
    }
});
exports.default = router;
