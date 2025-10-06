"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireParent = exports.requireStudent = exports.requireTeacher = exports.requireAdmin = exports.checkRole = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// ----- Verify JWT -----
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided." });
    }
    const token = authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Token missing." });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded.id || !decoded.role || !decoded.email) {
            return res.status(403).json({ message: "Invalid token payload" });
        }
        // Gán trực tiếp vào req.user
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error("JWT verify error:", err);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
exports.verifyToken = verifyToken;
// ----- Role check -----
const checkRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        if (!roles.includes(user.role)) {
            return res
                .status(403)
                .json({ message: "Forbidden: Insufficient permissions" });
        }
        next();
    };
};
exports.checkRole = checkRole;
// ----- Shortcut middlewares -----
exports.requireAdmin = (0, exports.checkRole)(["admin"]);
exports.requireTeacher = (0, exports.checkRole)(["teacher"]);
exports.requireStudent = (0, exports.checkRole)(["student"]);
exports.requireParent = (0, exports.checkRole)(["parent"]);
