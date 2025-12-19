import { Request, Response, NextFunction } from "express";
import { connectDB } from "../configs/db";
import { AuthRequest } from "./authMiddleware";

export async function checkGradesLock(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Allow lock management endpoints (lock/unlock) to proceed
    if (req.path.startsWith("/lock/")) {
      console.log(
        "✅ [checkGradesLock] Allowing lock management endpoint:",
        req.path,
      );
      return next();
    }

    // Allow GET requests (read-only)
    if (req.method === "GET") {
      console.log("✅ [checkGradesLock] Allowing GET request");
      return next();
    }

    // For POST/PUT/DELETE, check global lock status
    const db = await connectDB();
    const settings = db.collection<{ _id: string; locked: boolean }>(
      "settings",
    );

    const lockDoc = await settings.findOne({ _id: "gradesLockStatus" });
    console.log("🔍 [checkGradesLock] Global lock status:", lockDoc?.locked);

    if (lockDoc?.locked) {
      // Check if user is admin - admins can bypass global lock
      const user = (req as AuthRequest).user;
      if (user?.role === "admin") {
        console.log("✅ [checkGradesLock] Admin bypass: allowing request");
        return next();
      }

      console.error("❌ [checkGradesLock] Global lock active, denying request");
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
