import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import os from "os";

import authRoutes from "./Routers/auth";
import newsRoutes from "./Routers/news";
import gradesRoutes from "./Routers/grades";
import adminRoutes from "./Routers/admin";
import teacherRoutes from "./Routers/teacherAuth";

import { connectDB, ensureIndexes } from "./configs/db";
import { verifyToken, checkRole } from "./middleware/authMiddleware";
import { checkGradesLock } from "./middleware/checkLock";
import classRouter from "./Routers/classes";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "student" | "teacher" | "admin" | "parent";
        email: string;
      };
    }
  }
}

const app = express();
app.use("/api/admin/classes", classRouter);
app.use(cors());
app.use(express.json());

// ================== API Routes ==================
app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);

// 👉 Tất cả API nhập điểm/giáo viên sẽ check lock từ MongoDB
app.use("/api/grades", checkGradesLock, gradesRoutes);
app.use("/api/teachers", checkGradesLock, teacherRoutes);

// Admin route (không check lock, admin được phép mở/đóng)
app.use("/api/admin", adminRoutes);

app.get("/api/protected", verifyToken, (req: Request, res: Response) => {
  res.json({ message: "✅ Access granted", user: req.user });
});

app.get(
  "/api/admin/test",
  verifyToken,
  checkRole(["admin"]),
  (req: Request, res: Response) => {
    res.json({ message: "✅ Admin access", user: req.user });
  }
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/videos", express.static(path.join(__dirname, "uploads/videos")));

// ================== Serve Frontend Build ==================
app.use(express.static(path.join(__dirname, "../dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// ================== Start Server ==================
const PORT = Number(process.env.PORT) || 8000;
const HOST = "0.0.0.0"; // cho phép kết nối LAN

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

(async () => {
  try {
    await connectDB();
    await ensureIndexes();

    app.listen(PORT, HOST, () => {
      const localIP = getLocalIP();

      console.log("🚀 Backend + Frontend running at:");
      console.log(`   → Local:  http://UI-KIT.com:${PORT}`);
      console.log(`   → LAN:    http://${localIP}:${PORT}`);
      console.log(`📰 News API:      http://${localIP}:${PORT}/api/news`);
      console.log(`🔑 Auth API:      http://${localIP}:${PORT}/api/auth`);
      console.log(`📊 Grades API:    http://${localIP}:${PORT}/api/grades`);
      console.log(`🛠️ Admin API:     http://${localIP}:${PORT}/api/admin`);
      console.log(`👨‍🏫 Teacher API:  http://${localIP}:${PORT}/api/teachers`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
