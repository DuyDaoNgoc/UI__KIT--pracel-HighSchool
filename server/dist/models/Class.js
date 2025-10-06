"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ClassSchema = new mongoose_1.Schema({
    grade: { type: String, required: true },
    classLetter: { type: String, required: true },
    schoolYear: { type: String, required: true },
    major: { type: String, required: true },
    classCode: { type: String, required: true, trim: true },
    teacherId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Teacher", default: null },
    teacherName: { type: String, default: "" },
    studentIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    className: {
        type: String,
        required: true,
        trim: true,
        default: function () {
            // ✅ Tự sinh tên lớp (vd: "12A - CNTT")
            return `${this.grade}${this.classLetter} - ${this.major}`;
        },
    },
}, { timestamps: true });
// ✅ Unique index: đảm bảo không trùng lớp trong cùng năm & chuyên ngành
ClassSchema.index({ classCode: 1, schoolYear: 1, major: 1 }, { unique: true });
// 🔧 Optional: xoá index cũ lỗi nếu cần khi khởi động server
// await ClassModel.collection.dropIndexes();
exports.default = mongoose_1.default.model("Class", ClassSchema);
