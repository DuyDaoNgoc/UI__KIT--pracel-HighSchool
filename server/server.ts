import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./Routers/auth";
import { connectDB, ensureIndexes } from "./configs/db";
import bcrypt from "bcryptjs";
import { IUser } from "./types/user";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

async function seedAdmin() {
  const db = await connectDB();
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;

  const users = db.collection<IUser>("users");
  const exists = await users.findOne({ email: ADMIN_EMAIL });
  if (!exists) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await users.insertOne({
      username: "admin",
      email: ADMIN_EMAIL,
      password: hash,
      role: "admin",
      createdAt: new Date(),
    });
    console.log("✅ Seeded admin:", ADMIN_EMAIL);
  }
}

const PORT = Number(process.env.PORT) || 5000;

(async () => {
  await connectDB();
  await ensureIndexes();
  await seedAdmin();
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})();
