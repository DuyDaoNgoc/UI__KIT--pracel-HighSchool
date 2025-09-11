import { Request, Response } from "express";
import { createUser, findUserByEmail } from "./userService";
import { IUser } from "../../types/user";
import crypto from "crypto"; // 👈 để sinh customId random

export async function registerUser(req: Request, res: Response) {
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
      children, // nếu role = parent thì có children (id học sinh)
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // ✅ phân loại role
    const userRole: IUser["role"] =
      role === "teacher"
        ? "teacher"
        : role === "admin"
        ? "admin"
        : role === "parent"
        ? "parent"
        : "student";

    // ✅ sinh customId ngẫu nhiên (11 ký tự hex)
    const customId = crypto.randomBytes(6).toString("hex");

    // ✅ avatar mặc định hoặc lấy từ file upload
    const avatar: string = (req as any).file?.filename
      ? `/uploads/${(req as any).file.filename}`
      : "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    // ✅ tạo user mới
    const safeUser = await createUser({
      customId, // 👈 thay vì id
      username,
      email,
      password,
      role: userRole,
      dob: dob ? new Date(dob) : undefined,
      class: className,
      schoolYear,
      phone,
      address,
      avatar,
      createdAt: new Date(),
      children:
        userRole === "parent" && Array.isArray(children) ? children : [],
    });

    return res
      .status(201)
      .json({ message: "User registered successfully", user: safeUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
