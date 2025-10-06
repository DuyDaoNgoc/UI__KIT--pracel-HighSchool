import { Router, Request, Response } from "express";
import { connectDB } from "../../configs/db";
import {
  verifyToken,
  checkRole,
  AuthRequest,
} from "../../middleware/authMiddleware";

const router = Router();

// ==============================
// GET /api/news/pending
// ==============================
router.get(
  "/pending",
  verifyToken,
  checkRole(["admin"]),
  async (_req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const newsCollection = db.collection("news");

      const items = await newsCollection.find({ status: "pending" }).toArray();

      // Trả về mảng rỗng nếu không có
      res.json(items);
    } catch (err) {
      console.error("news/pending error:", err);
      res.status(500).json({ message: "Failed to fetch pending news" });
    }
  }
);

// ==============================
// POST /api/news/:id/approve
// ==============================
router.post(
  "/:id/approve",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const db = await connectDB();
      const newsCollection = db.collection("news");

      const r = await newsCollection.updateOne(
        { id },
        { $set: { status: "approved", updatedAt: new Date() } }
      );

      if (!r.matchedCount)
        return res.status(404).json({ message: "News not found" });

      res.json({ ok: true });
    } catch (err) {
      console.error("news/approve error:", err);
      res.status(500).json({ message: "Failed to approve news" });
    }
  }
);

// ==============================
// POST /api/news/:id/reject
// ==============================
router.post(
  "/:id/reject",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const db = await connectDB();
      const newsCollection = db.collection("news");

      const r = await newsCollection.updateOne(
        { id },
        { $set: { status: "rejected", updatedAt: new Date() } }
      );

      if (!r.matchedCount)
        return res.status(404).json({ message: "News not found" });

      res.json({ ok: true });
    } catch (err) {
      console.error("news/reject error:", err);
      res.status(500).json({ message: "Failed to reject news" });
    }
  }
);

export default router;
