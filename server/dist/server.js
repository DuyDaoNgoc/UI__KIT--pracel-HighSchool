"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const auth_1 = __importDefault(require("./Routers/auth/auth"));
const news_1 = __importDefault(require("./Routers/news/news"));
const grades_1 = __importDefault(require("./Routers/grades/grades"));
const admin_1 = __importDefault(require("./Routers/admin/admin"));
const teacherAuth_1 = __importDefault(require("./Routers/teacher/teacherAuth"));
const classes_1 = __importDefault(require("./Routers/class/classes"));
const teacherRoutes_1 = __importDefault(require("./Routers/teacher/teacherRoutes")); // admin quản lý GV
const teacherRoutes_2 = __importDefault(require("./Routers/teacher/teacherRoutes")); // CRUD cơ bản giáo viên
const db_1 = require("./configs/db");
const authMiddleware_1 = require("./middleware/authMiddleware");
const checkLock_1 = require("./middleware/checkLock");
const User_1 = __importDefault(require("./models/User")); // 👈 Thêm dòng này
dotenv_1.default.config();
const app = (0, express_1.default)();
// ================== Middleware ==================
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
}));
app.use((0, compression_1.default)());
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use(express_1.default.json({ limit: "5mb" }));
// Lấy danh sách user
app.get("/api/users", async (req, res) => {
    const users = await User_1.default.find().select("-password");
    res.json(users);
});
// Block / Unblock user
app.patch("/api/users/:id/block", async (req, res) => {
    const { id } = req.params;
    const { isBlocked } = req.body;
    await User_1.default.findByIdAndUpdate(id, { isBlocked });
    res.json({ success: true });
});
// ================== API Routes ==================
app.use("/api/admin/classes", classes_1.default);
app.use("/api/auth", auth_1.default);
app.use("/api/news", news_1.default);
app.use("/api/grades", checkLock_1.checkGradesLock, grades_1.default);
const userRoutes_1 = __importDefault(require("./Routers/auth/userRoutes"));
app.use("/api/users", userRoutes_1.default);
// 👨‍🏫 Giáo viên
app.use("/api/teachers/auth", teacherAuth_1.default); // login, profile
app.use("/api/teachers", teacherRoutes_2.default); // danh sách, CRUD
app.use("/api/admin/teachers", teacherRoutes_1.default); // quản lý giáo viên admin
app.use("/api/admin", admin_1.default);
// phụ huynh
const parents_1 = __importDefault(require("./Routers/parent/parents"));
// 🧑‍💼 Admin Parents
app.use("/api/admin/parents", parents_1.default);
// ================== Test Routes ==================
app.get("/api/protected", authMiddleware_1.verifyToken, (req, res) => {
    res.json({ message: "✅ Access granted", user: req.user });
});
app.get("/api/admin/test", authMiddleware_1.verifyToken, (0, authMiddleware_1.checkRole)(["admin"]), (req, res) => {
    res.json({ message: "✅ Admin access", user: req.user });
});
// ================== Static Routes ==================
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "uploads"), {
    maxAge: "365d",
    immutable: true,
}));
app.use("/videos", express_1.default.static(path_1.default.join(__dirname, "uploads/videos"), {
    maxAge: "365d",
    immutable: true,
}));
// ================== Frontend Build ==================
app.use(express_1.default.static(path_1.default.join(__dirname, "../dist"), {
    maxAge: "365d",
    immutable: true,
}));
// Fallback SPA
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../dist/index.html"));
});
// ================== Error Handler ==================
app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
});
// ================== HTTP + Socket.IO ==================
const PORT = Number(process.env.PORT) || 8000;
const HOST = "0.0.0.0";
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: "*" },
    transports: ["websocket", "polling"],
});
io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);
    socket.on("message", (data) => io.emit("message", data));
    socket.on("disconnect", () => console.log("❎ Client disconnected:", socket.id));
});
// ================== Lấy IP LAN ==================
function getLocalIP() {
    const nets = os_1.default.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === "IPv4" && !net.internal)
                return net.address;
        }
    }
    return "localhost";
}
// ================== Start Server ==================
(async () => {
    try {
        await (0, db_1.connectDB)();
        await (0, db_1.ensureIndexes)();
        httpServer.listen(PORT, HOST, () => {
            const localIP = getLocalIP();
            console.log("\n🚀 Backend + Frontend + Socket.IO running at:");
            console.log(`   → Local:   http://localhost:${PORT}`);
            console.log(`   → LAN:     http://${localIP}:${PORT}`);
            console.log(`📰 News API:      http://${localIP}:${PORT}/api/news`);
            console.log(`🔑 Auth API:      http://${localIP}:${PORT}/api/auth/login`);
            console.log(`📊 Grades API:    http://${localIP}:${PORT}/api/grades`);
            console.log(`🛠️ Admin API:     http://${localIP}:${PORT}/api/admin`);
            console.log(`👨‍🏫 Teacher Auth: http://${localIP}:${PORT}/api/teachers/auth`);
            console.log(`👩‍🏫 Teacher CRUD: http://${localIP}:${PORT}/api/teachers`);
            console.log(`📚 Admin Teachers: http://${localIP}:${PORT}/api/admin/teachers`);
        });
    }
    catch (err) {
        console.error("❌ Failed to start server:", err);
        process.exit(1);
    }
})();
