import { Request, Response } from "express";
import { findUserByEmail } from "./userService"; // sửa đường dẫn cho đúng
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

    // 1. Check admin trong .env
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

    // 2. Nếu không phải admin → check trong DB
    const user = await findUserByEmail(email);
    if (!user || !user.password)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    // token user chuẩn
    const token = jwt.sign(
      { id: user._id?.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // safe user
    const safeUser: IUser & { _id: string } = {
      _id: user._id?.toString() || "",
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
