// server.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import os from "os";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocket } from "./utils/socketio";
import compression from "compression";
import helmet from "helmet";

import authRoutes from "./Routers/auth/auth";
import newsRoutes from "./Routers/news/news";
import gradesRoutes from "./Routers/grades/grades";
import adminRoutes from "./Routers/admin/admin";
import teacherAuthRoutes from "./Routers/teacher/teacherAuth";
import classRouter from "./Routers/class/classes";
import teacherAdminRoutes from "./Routers/teacher/teacherRoutes";
import teacherRoutes from "./Routers/teacher/teacherRoutes";
import userRoutes from "./Routers/auth/userRoutes";
import parentsRoutes from "./Routers/parent/parents";
import studentRoutes from "./Routers/student/index";
import subjectRoutes from "./Routers/Subject/index";
import paymentRoutes from "./Routers/Payment/index";
import timetableRoutes from "./Routers/Timetable/index";
import postponeRoutes from "./Routers/Postpone/index";
import gradeLockRoutes from "./Routers/grades/gradeLock";
import gradeRoutes from "./Routers/grades/gradeRoutes";
import reportsRouter from "./Routers/reports/reportsRouter";

import { connectDB, ensureIndexes } from "./configs/db";
import { verifyToken, checkRole } from "./middleware/authMiddleware";
import { checkGradesLock } from "./middleware/checkLock";
import User from "./models/User";

dotenv.config();

// Note: Request augmentation is provided under server/types/express/index.d.ts

const app = express();

// ================== Middleware ==================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
);
app.use(compression());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "5mb" }));

// NOTE: user APIs are handled by `userRoutes` (controllers/userController.getAllUsers)
// The explicit app.get was removed so the router can enrich user data (class/major/etc.)

app.patch("/api/users/:id/block", async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isBlocked },
      { new: true },
    ).select("-password");
    res.json({ success: true, data: updatedUser });
  } catch (err) {
    console.error("❌ Error blocking user:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

// ================== API Routes ==================
app.use("/api/classes", classRouter);
app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/grades", checkGradesLock, gradesRoutes);
app.use("/api/users", userRoutes);

// Học sinh, Giáo viên
app.use("/api/students", studentRoutes);
app.use("/api/teachers/auth", teacherAuthRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/admin/teachers", teacherAdminRoutes);

// Subjects, Payments, Timetables
app.use("/api/subjects", subjectRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/postpone-requests", postponeRoutes);

// Grades và Grade Locks
app.use("/api/grades/lock", gradeLockRoutes);
app.use("/api/grades", gradeRoutes);

// Reports
app.use("/api/reports", reportsRouter);

//  Admin
app.use("/api/admin", adminRoutes);

// Phụ huynh
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
  },
);

// ================== Socket URL Route ==================
app.get("/socket-url", (req, res) => {
  try {
    const localIP = getLocalIP();
    const PORT = Number(process.env.PORT) || 8000;
    res.json({ url: `http://${localIP}:${PORT}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ================== Static Routes ==================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "365d",
    immutable: true,
  }),
);
app.use(
  "/videos",
  express.static(path.join(__dirname, "uploads/videos"), {
    maxAge: "365d",
    immutable: true,
  }),
);

// ================== Frontend Build ==================
app.use(
  express.static(path.join(__dirname, "../dist"), {
    maxAge: "365d",
    immutable: true,
  }),
);

// ================== SPA Fallback ==================
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

// Expose io to other modules (routes) so they can emit events
initSocket(io);

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("message", (data) => io.emit("message", data));
  socket.on("disconnect", () =>
    console.log("❎ Client disconnected:", socket.id),
  );

  // Allow clients to join rooms after authentication
  socket.on("join", (rooms: string | string[]) => {
    try {
      if (!rooms) return;
      if (typeof rooms === "string") {
        socket.join(rooms);
        console.log(`🔐 Socket ${socket.id} joined room ${rooms}`);
      } else if (Array.isArray(rooms)) {
        rooms.forEach((r) => socket.join(r));
        console.log(`🔐 Socket ${socket.id} joined rooms ${rooms.join(",")}`);
      }
    } catch (err) {
      console.warn("⚠️ Error joining rooms:", err);
    }
  });

  socket.on("leave", (room: string) => {
    try {
      socket.leave(room);
      console.log(`🔓 Socket ${socket.id} left room ${room}`);
    } catch (err) {
      console.warn("⚠️ Error leaving room:", err);
    }
  });
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
      console.log(`   → LAN:     http://${localIP}:5000`);
      console.log(`📰 News API:      http://${localIP}:${PORT}/api/news`);
      console.log(`🔑 Auth API:      http://${localIP}:${PORT}/api/auth/login`);
      console.log(`📊 Grades API:    http://${localIP}:${PORT}/api/grades`);
      console.log(`🛠️ Admin API:     http://${localIP}:${PORT}/api/admin`);
      console.log(
        `👨‍🏫 Teacher Auth: http://${localIP}:${PORT}/api/teachers/auth`,
      );
      console.log(`👩‍🏫 Teacher CRUD: http://${localIP}:${PORT}/api/teachers`);
      console.log(
        `📚 Admin Teachers: http://${localIP}:${PORT}/api/admin/teachers`,
      );
    });
  } catch (err) {
    console.error("❌⛔ Failed to start server:", err);
    process.exit(1);
  }
})();
