import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { IUser } from "../types/user";

export async function ensureAdminUser() {
  const db = await connectDB();
  const users = db.collection<IUser>("users");

  const adminEmail = process.env.ADMIN_EMAIL as string;
  const adminPassword = process.env.ADMIN_PASSWORD as string;

  if (!adminEmail || !adminPassword) {
    console.warn("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD missing in .env");
    return;
  }

  const existing = await users.findOne({ email: adminEmail });
  if (!existing) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await users.insertOne({
      username: "Administrator",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(),
    });
    console.log("✅ Admin user created in DB");
  } else {
    console.log("ℹ️ Admin user already exists");
  }
}
