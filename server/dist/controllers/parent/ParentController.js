"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParent = exports.getAllParents = void 0;
const Parent_1 = __importDefault(require("../../models/Parent"));
// GET tất cả phụ huynh
const getAllParents = async (req, res) => {
    try {
        const parents = await Parent_1.default.find().populate("childrenIds");
        res.status(200).json(parents);
    }
    catch (err) {
        console.error("❌ Lỗi getAllParents:", err);
        res.status(500).json({ message: "Lỗi server khi lấy phụ huynh" });
    }
};
exports.getAllParents = getAllParents;
// POST tạo phụ huynh mới
const createParent = async (req, res) => {
    try {
        const { name, email, phone, childrenIds } = req.body;
        const newParent = new Parent_1.default({ name, email, phone, childrenIds });
        await newParent.save();
        res.status(201).json(newParent);
    }
    catch (err) {
        console.error("❌ Lỗi createParent:", err);
        res.status(500).json({ message: "Lỗi server khi tạo phụ huynh" });
    }
};
exports.createParent = createParent;
