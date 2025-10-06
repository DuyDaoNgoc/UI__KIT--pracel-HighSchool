// server.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import os from "os";
import { createServer } from "http";
import { Server } from "socket.io";
import compression from "compression";
import helmet from "helmet";

import authRoutes from "./Routers/auth/auth";
import newsRoutes from "./Routers/news/news";
import gradesRoutes from "./Routers/grades/grades";
import adminRoutes from "./Routers/admin/admin";
import teacherAuthRoutes from "./Routers/teacher/teacherAuth";
import classRouter from "./Routers/class/classes";
import teacherAdminRoutes from "./Routers/teacher/teacherRoutes"; // admin quản lý GV
import teacherRoutes from "./Routers/teacher/teacherRoutes"; // CRUD cơ bản giáo viên
import { connectDB, ensureIndexes } from "./configs/db";
import { verifyToken, checkRole } from "./middleware/authMiddleware";
import { checkGradesLock } from "./middleware/checkLock";
import User from "./models/User"; // 👈 Thêm dòng này

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "student" | "teacher" | "admin" | "parent";
        email: string;
      };
      db?: any;
    }
  }
}

const app = express();

// ================== Middleware ==================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);
app.use(compression());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "5mb" }));
// Lấy danh sách user
app.get("/api/users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// Block / Unblock user
app.patch("/api/users/:id/block", async (req, res) => {
  const { id } = req.params;
  const { isBlocked } = req.body;
  await User.findByIdAndUpdate(id, { isBlocked });
  res.json({ success: true });
});

// ================== API Routes ==================
app.use("/api/admin/classes", classRouter);
app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/grades", checkGradesLock, gradesRoutes);
import userRoutes from "./Routers/auth/userRoutes";
app.use("/api/users", userRoutes);

// 👨‍🏫 Giáo viên
app.use("/api/teachers/auth", teacherAuthRoutes); // login, profile
app.use("/api/teachers", teacherRoutes); // danh sách, CRUD
app.use("/api/admin/teachers", teacherAdminRoutes); // quản lý giáo viên admin

app.use("/api/admin", adminRoutes);
// phụ huynh
import parentsRoutes from "./Routers/parent/parents";

// 🧑‍💼 Admin Parents
app.use("/api/admin/parents", parentsRoutes);

// ================== Test Routes ==================
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

// ================== Static Routes ==================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "365d",
    immutable: true,
  })
);
app.use(
  "/videos",
  express.static(path.join(__dirname, "uploads/videos"), {
    maxAge: "365d",
    immutable: true,
  })
);

// ================== Frontend Build ==================
app.use(
  express.static(path.join(__dirname, "../dist"), {
    maxAge: "365d",
    immutable: true,
  })
);

// Fallback SPA
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// ================== Error Handler ==================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// ================== HTTP + Socket.IO ==================
const PORT = Number(process.env.PORT) || 8000;
const HOST = "0.0.0.0";
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("message", (data) => io.emit("message", data));
  socket.on("disconnect", () =>
    console.log("❎ Client disconnected:", socket.id)
  );
});

// ================== Lấy IP LAN ==================
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

// ================== Start Server ==================
(async () => {
  try {
    await connectDB();
    await ensureIndexes();

    httpServer.listen(PORT, HOST, () => {
      const localIP = getLocalIP();
      console.log("\n🚀 Backend + Frontend + Socket.IO running at:");
      console.log(`   → Local:   http://localhost:${PORT}`);
      console.log(`   → LAN:     http://${localIP}:${PORT}`);
      console.log(`📰 News API:      http://${localIP}:${PORT}/api/news`);
      console.log(`🔑 Auth API:      http://${localIP}:${PORT}/api/auth/login`);
      console.log(`📊 Grades API:    http://${localIP}:${PORT}/api/grades`);
      console.log(`🛠️ Admin API:     http://${localIP}:${PORT}/api/admin`);
      console.log(
        `👨‍🏫 Teacher Auth: http://${localIP}:${PORT}/api/teachers/auth`
      );
      console.log(`👩‍🏫 Teacher CRUD: http://${localIP}:${PORT}/api/teachers`);
      console.log(
        `📚 Admin Teachers: http://${localIP}:${PORT}/api/admin/teachers`
      );
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
