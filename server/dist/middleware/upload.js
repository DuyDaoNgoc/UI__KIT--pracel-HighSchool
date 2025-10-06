"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// 🔧 Thư mục lưu upload
const uploadDir = path_1.default.join(__dirname, "../uploads");
// Nếu thư mục chưa có thì tự tạo (tránh lỗi ENOENT)
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// ⚙️ Cấu hình storage cho multer
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const safeName = `${Date.now()}-${file.fieldname}${ext}`;
        cb(null, safeName);
    },
});
// ✅ Middleware upload (giới hạn 5MB, chỉ cho phép ảnh)
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif/;
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowed.test(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image files are allowed!"));
        }
    },
});
