import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User"; // nhớ export dạng { User } trong models/User.ts
import { IUserDocument } from "../types/user";

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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "student",
      dob,
      class: className,
      schoolYear,
      phone,
      address,
    });

    await newUser.save();
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

    const user: IUserDocument | null = await User.findOne({ email });
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

export default router;
