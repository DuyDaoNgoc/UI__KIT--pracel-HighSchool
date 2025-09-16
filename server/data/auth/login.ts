import { Request, Response } from "express";
import { findUserByEmail, updateUserById } from "./userService";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { IUser } from "../../types/user";

dotenv.config();

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing email or password" });

    // --- 1. Admin login ---
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { id: "admin", email, role: "admin" },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: "admin",
          username: "Administrator",
          role: "admin",
          email,
          teacherId: null,
          parentId: null,
        },
      });
    }

    // --- 2. User login ---
    const user: IUser & {
      _id: any;
      loginAttempts?: number;
      lockUntil?: number;
    } = (await findUserByEmail(email)) as any;
    if (!user || !user.password)
      return res.status(401).json({ message: "Invalid email or password" });

    const now = Date.now();

    // --- Kiểm tra lock ---
    if (user.lockUntil && user.lockUntil > now) {
      const secondsLeft = Math.ceil((user.lockUntil - now) / 1000);
      return res.status(403).json({
        message: `Tài khoản bị khóa. Thử lại sau ${secondsLeft} giây`,
        lockTime: secondsLeft,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // --- Login sai ---
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Tính thời gian khóa nếu vượt quá 4 lần
      if (user.loginAttempts > 4) {
        const lockSeconds = Math.pow(2, user.loginAttempts - 4) * 10; // khóa tăng dần
        user.lockUntil = now + lockSeconds * 1000;
      }

      // Cập nhật DB
      await updateUserById(user._id, {
        loginAttempts: user.loginAttempts,
        lockUntil: user.lockUntil,
      });

      return res.status(401).json({
        message: "Invalid email or password",
        attemptsLeft: Math.max(0, 4 - user.loginAttempts),
        lockTime: user.lockUntil ? Math.ceil((user.lockUntil - now) / 1000) : 0,
      });
    }

    // --- Login thành công: reset loginAttempts và lockUntil ---
    await updateUserById(user._id, { loginAttempts: 0, lockUntil: 0 });

    // --- JWT ---
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // --- Safe user ---
    const safeUser: IUser & { _id: string } = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      dob: user.dob,
      class: user.class,
      schoolYear: user.schoolYear,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      createdAt: user.createdAt || new Date(),
      teacherId: user.teacherId ?? null,
      parentId: user.parentId ?? null,
      children: user.children || [],
      grades: user.grades || [],
      creditsTotal: user.creditsTotal || 0,
      creditsEarned: user.creditsEarned || 0,
      schedule: user.schedule || [],
      tuitionTotal: user.tuitionTotal || 0,
      tuitionPaid: user.tuitionPaid || 0,
      tuitionRemaining: user.tuitionRemaining || 0,
    };

    return res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
