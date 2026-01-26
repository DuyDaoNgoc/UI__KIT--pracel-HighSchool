// server/middleware/authMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User";
import { connectDB } from "../configs/db";

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
export const verifyToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  console.log(
    "🔑 verifyToken - Auth header:",
    authHeader ? "Present" : "Missing",
  );

  if (authHeader) {
    console.log("   Full header value:", authHeader.substring(0, 50) + "...");
  }

  if (!authHeader?.startsWith("Bearer ")) {
    console.error("❌ Invalid auth header format or missing Bearer prefix");
    return res.status(401).json({ message: "No token provided." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.error("❌ Token missing after Bearer");
    return res.status(401).json({ message: "Token missing." });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as AuthPayload;

    console.log("✅ Token verified, user:", decoded);

    if (!decoded.id || !decoded.role || !decoded.email) {
      console.error("❌ Invalid token payload:", decoded);
      return res.status(403).json({ message: "Invalid token payload" });
    }

    // Try to enrich the token payload with user's classCode and other fields
    try {
      const userDoc = await User.findById(String(decoded.id)).lean();
      let classCode: any = userDoc?.classCode || null;

      // If student and no classCode on user, try to load from students collection
      if (
        !classCode &&
        userDoc &&
        userDoc.role === "student" &&
        userDoc.studentId
      ) {
        try {
          const db = await connectDB();
          const students = db.collection("students");
          const studentRec = await students.findOne({
            studentId: userDoc.studentId,
          });
          if (studentRec) {
            classCode = studentRec.classCode || studentRec.classLetter || null;
          }
        } catch (e) {
          console.warn(
            "Could not enrich classCode from students collection:",
            e,
          );
        }
      }

      (req as AuthRequest).user = {
        ...decoded,
        classCode,
        teacherId: userDoc?.teacherId || decoded.teacherId || null,
        studentId: userDoc?.studentId || decoded.studentId || null,
      } as AuthPayload;
    } catch (e) {
      // If enrichment fails, fall back to token payload only
      (req as AuthRequest).user = decoded;
    }

    return next();
  } catch (err) {
    console.error("❌ JWT verify error:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// ----- Role check -----
export const checkRole = (roles: UserRole[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    console.log("🔐 checkRole - User:", user, "Required roles:", roles);
    if (!user) {
      console.error("❌ No user in request");
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(user.role)) {
      console.error("❌ User role not in allowed roles", user.role, roles);
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
