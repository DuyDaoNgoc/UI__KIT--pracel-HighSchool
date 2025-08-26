import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "../configs/db";
import { verifyToken, checkRole } from "../middleware/authMiddleware";

const router = Router();

// Register
router.post("/register", async (req: Request, res: Response) => {
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
      return res.status(400).json({ message: "Missing required fields" });
    }

    const db = await connectDB();
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await users.insertOne({
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
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    // 1. Check admin từ .env
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { email, role: "admin" },
        process.env.JWT_SECRET as string,
        { expiresIn: "1h" }
      );

      return res.json({
        token,
        user: {
          id: "admin",
          username: "Administrator",
          role: "admin",
          email,
        },
      });
    }

    // 2. Nếu không phải admin → check trong DB
    const db = await connectDB();
    const users = db.collection("users");

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

// ✅ Protected route (test token)
router.get("/me", verifyToken, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// ✅ Admin-only route
router.get(
  "/admin",
  verifyToken,
  checkRole(["admin"]),
  (req: Request, res: Response) => {
    res.json({ message: "Welcome Admin!" });
  }
);

export default router;
