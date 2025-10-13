// src/middleware/globalHandler.ts
import { Request, Response, NextFunction } from "express";

export function globalHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // Thêm dữ liệu chung vào req nếu cần
    // req.db = someDbConnection;

    // Ghi log request
    console.log(`${req.method} ${req.path}`);

    next();
  } catch (err) {
    console.error("❌ Middleware error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Response formatter
export function responseHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const oldJson = res.json;
  (res as any).json = function (data: any) {
    const wrapped = { success: true, data, message: "" };
    return oldJson.call(this, wrapped);
  };

  next();
}
