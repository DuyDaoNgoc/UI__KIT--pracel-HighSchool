import { Db } from "mongodb";
import bcrypt from "bcryptjs";
import { IUser } from "../types/user";

export async function ensureAdmin(db: Db) {
  const adminEmail = process.env.ADMIN_EMAIL!;
  const adminPassword = process.env.ADMIN_PASSWORD!;

  const existing = await db
    .collection<IUser>("users")
    .findOne({ email: adminEmail });
  if (existing) return;

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await db.collection<IUser>("users").insertOne({
    username: "admin",
    email: adminEmail,
    password: hashedPassword,
    role: "admin",
    avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    createdAt: new Date(),
  });
  console.log("✅ Admin created:", adminEmail);
}
