// server/controllers/adminController.ts
import { Request, Response } from "express";
import { connectDB } from "../configs/db";

interface IAppSetting {
  key: string;
  value: any;
  updatedAt?: Date;
}

/**
 * GET /api/admin/grades/status
 * Trả về { locked: boolean }
 */
export async function getLockStatus(req: Request, res: Response) {
  try {
    const db = await connectDB();
    const settings = db.collection<IAppSetting>("app_settings");
    const doc = await settings.findOne({ key: "grades_locked" });
    const locked = !!doc?.value;
    return res.json({ locked });
  } catch (err) {
    console.error("❌ getLockStatus error:", err);
    return res.status(500).json({ message: "Failed to get lock status" });
  }
}

/**
 * POST /api/admin/grades/lock
 * Đặt khóa = true
 */
export async function lockGrades(req: Request, res: Response) {
  try {
    const db = await connectDB();
    const settings = db.collection<IAppSetting>("app_settings");
    await settings.updateOne(
      { key: "grades_locked" },
      { $set: { value: true, updatedAt: new Date() } },
      { upsert: true }
    );
    return res.json({ locked: true });
  } catch (err) {
    console.error("❌ lockGrades error:", err);
    return res.status(500).json({ message: "Failed to lock grades" });
  }
}

/**
 * POST /api/admin/grades/unlock
 * Đặt khóa = false
 */
export async function unlockGrades(req: Request, res: Response) {
  try {
    const db = await connectDB();
    const settings = db.collection<IAppSetting>("app_settings");
    await settings.updateOne(
      { key: "grades_locked" },
      { $set: { value: false, updatedAt: new Date() } },
      { upsert: true }
    );
    return res.json({ locked: false });
  } catch (err) {
    console.error("❌ unlockGrades error:", err);
    return res.status(500).json({ message: "Failed to unlock grades" });
  }
}
