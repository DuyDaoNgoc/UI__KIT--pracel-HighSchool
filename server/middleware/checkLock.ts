import { Request, Response, NextFunction } from "express";
import { connectDB } from "../configs/db";

export async function checkGradesLock(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const db = await connectDB();
    const settings = db.collection<{ _id: string; locked: boolean }>(
      "settings"
    );

    const lockDoc = await settings.findOne({ _id: "gradesLockStatus" });

    if (lockDoc?.locked) {
      return res
        .status(403)
        .json({ message: "❌ Hệ thống đã khoá điểm, không thể chỉnh sửa" });
    }

    next();
  } catch (err) {
    console.error("❌ checkGradesLock error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
}
