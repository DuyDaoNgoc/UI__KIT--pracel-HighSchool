import { Request, Response } from "express";
import { findUserByEmail } from "./userService";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing email or password" });

    const user = await findUserByEmail(email);
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { userId: user._id?.toString(), role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    const { password: _pw, ...safe } = user;
    return res
      .status(200)
      .json({ message: "Login successful", token, user: safe });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
