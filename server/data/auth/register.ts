import { Request, Response } from "express";
import { createUser, findUserByEmail } from "./userService";
import { IUser } from "../../types/user";

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
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const userRole: IUser["role"] =
      role === "teacher" ? "teacher" : role === "admin" ? "admin" : "student";

    // createUser đã trả về SafeUser (không có password)
    const safeUser = await createUser({
      username,
      email,
      password,
      role: userRole,
      dob: dob ? new Date(dob) : undefined,
      class: className,
      schoolYear,
      phone,
      address,
    });

    return res
      .status(201)
      .json({ message: "User registered successfully", user: safeUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
