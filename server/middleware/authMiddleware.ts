import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Payload trong token
export interface AuthPayload extends JwtPayload {
  id: string;
  role: "student" | "teacher" | "admin";
  email: string;
}

// Mở rộng type cho Request
export interface AuthRequest extends Request {
  user?: AuthPayload;
}

// ✅ Middleware kiểm tra token
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AuthPayload;

    req.user = decoded; // ✅ không lỗi nữa
    next();
  } catch {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// ✅ Middleware kiểm tra role
export const checkRole = (roles: Array<"student" | "teacher" | "admin">) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};

// ✅ Shortcut dành riêng cho admin
export const requireAdmin = checkRole(["admin"]);
