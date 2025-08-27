import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./Routers/auth";
import { connectDB, ensureIndexes } from "./configs/db";
import bcrypt from "bcryptjs";
import { IUser } from "./types/user";
import { verifyToken, checkRole } from "./middleware/authMiddleware";
import path from "path";

dotenv.config();
import { User } from "./models/user";
// 👉 Khai báo mở rộng type cho Express.Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "student" | "teacher" | "admin";
        email: string;
      };
    }
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// ✅ Route test bảo vệ bởi token
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "✅ Access granted", user: req.user });
});
// upload file avatar
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Route chỉ cho admin
app.get("/api/admin", verifyToken, checkRole(["admin"]), (req, res) => {
  res.json({ message: "✅ Admin access", user: req.user });
});

// ✅ Seed admin user (upsert tránh lỗi duplicate key)
async function seedAdmin() {
  const db = await connectDB();
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;

  const users = db.collection<IUser>("users");

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await users.updateOne(
    { username: "admin" }, // 🔑 filter theo username
    {
      $set: {
        username: "admin",
        email: ADMIN_EMAIL,
        password: hash,
        role: "admin",
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  console.log("✅ Admin ensured:", ADMIN_EMAIL);
}

const PORT = Number(process.env.PORT) || 8000;

(async () => {
  await connectDB();
  await ensureIndexes();
  await seedAdmin();
  app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
})();
