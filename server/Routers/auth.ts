import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "../configs/db";
import {
  verifyToken,
  checkRole,
  AuthRequest,
} from "../middleware/authMiddleware";

const router = Router();

// ----- Register User -----
router.post("/register", async (req: AuthRequest, res: Response) => {
  try {
    const {
      username,
      email,
      password,
      role,
      dob,
      class: className,
      schoolYear,
      phone,
      address,
    } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const db = await connectDB();
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      role: role || "student",
      dob,
      class: className,
      schoolYear,
      phone,
      address,
      createdAt: new Date(),
    };

    await users.insertOne(newUser);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { email, role: newUser.role },
    });
  } catch (err) {
    console.error("Register error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err });
  }
});

// ----- Login -----
router.post("/login", async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing email or password" });
    }

    // ----- Check admin from .env -----
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { id: "admin", email, role: "admin" },
        process.env.JWT_SECRET as string,
        { expiresIn: "1d" }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: "admin",
          username: "Administrator",
          role: "admin",
          email,
        },
      });
    }

    // ----- Check regular users in DB -----
    const db = await connectDB();
    const users = db.collection("users");
    const user = await users.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err });
  }
});

// ----- Test token (protected route) -----
router.get("/me", verifyToken, (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});

// ----- Admin-only test route -----
router.get(
  "/admin",
  verifyToken,
  checkRole(["admin"]),
  (req: AuthRequest, res: Response) => {
    res.json({ success: true, message: "Welcome Admin!", user: req.user });
  }
);

export default router;
