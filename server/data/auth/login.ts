import { Request, Response } from "express";
import { findUserByEmail } from "./userService";
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
      // ✅ token admin phải có id
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
        },
      });
    }

    // 2. Nếu không phải admin → check trong DB
    const user = await findUserByEmail(email);
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    // Mongo user
    const mongoUser = user as any;

    // ✅ token user chuẩn
    const token = jwt.sign(
      {
        id: mongoUser._id.toString(),
        email: mongoUser.email,
        role: mongoUser.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // ✅ safe user (không gửi password)
    const { password: _pw, ...safe } =
      typeof mongoUser.toObject === "function"
        ? mongoUser.toObject()
        : mongoUser;

    return res
      .status(200)
      .json({ message: "Login successful", token, user: safe });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
