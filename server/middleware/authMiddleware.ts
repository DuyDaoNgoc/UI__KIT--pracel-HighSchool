// server/middleware/authMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export type UserRole = "student" | "teacher" | "admin" | "parent";

export interface AuthPayload extends JwtPayload {
  id: string;
  role: UserRole;
  email: string;
  children?: {
    id: string;
    name: string;
    class?: string;
    schoolYear?: string;
  }[];
}

// Dùng generic để Express Request nhận user
export interface AuthRequest extends Request {
  user?: AuthPayload;
}

// ----- Verify JWT -----
export const verifyToken: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing." });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as AuthPayload;

    if (!decoded.id || !decoded.role || !decoded.email) {
      return res.status(403).json({ message: "Invalid token payload" });
    }
    // Gán trực tiếp vào req.user
    (req as AuthRequest).user = decoded;

    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// ----- Role check -----
export const checkRole = (roles: UserRole[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

// ----- Shortcut middlewares -----
export const requireAdmin = checkRole(["admin"]);
export const requireTeacher = checkRole(["teacher"]);
export const requireStudent = checkRole(["student"]);
export const requireParent = checkRole(["parent"]);
