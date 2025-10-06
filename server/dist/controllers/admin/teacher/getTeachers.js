"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeachers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const teacherModel_1 = __importDefault(require("../../../models/teacherModel"));
const getTeachers = async (req, res) => {
    try {
        const teachers = await teacherModel_1.default.find();
        const formattedTeachers = teachers.map((t) => {
            const _id = t._id instanceof mongoose_1.default.Types.ObjectId
                ? t._id.toString()
                : String(t._id);
            return {
                _id,
                name: t.name,
                dob: t.dob ? new Date(t.dob).toISOString().split("T")[0] : undefined,
                gender: t.gender,
                phone: t.phone ?? undefined,
                address: t.address ?? undefined,
                majors: Array.isArray(t.majors) ? t.majors : [],
                subjectClasses: Array.isArray(t.subjectClasses) ? t.subjectClasses : [],
                assignedClass: t.assignedClass ?? null,
                assignedClassCode: t.assignedClassCode ?? undefined,
                email: t.email ?? undefined,
                degree: t.degree ?? undefined,
                educationLevel: t.educationLevel ?? undefined,
                certificates: Array.isArray(t.certificates) ? t.certificates : [],
                research: t.research ?? undefined,
                subject: t.subject
                    ? Array.isArray(t.subject)
                        ? t.subject
                        : [t.subject]
                    : [],
                avatar: t.avatar ?? undefined,
                createdAt: t.createdAt
                    ? new Date(t.createdAt).toISOString()
                    : undefined,
                updatedAt: t.updatedAt
                    ? new Date(t.updatedAt).toISOString()
                    : undefined,
            };
        });
        return res.json({
            success: true,
            message: "Lấy danh sách giáo viên thành công",
            teachers: formattedTeachers,
        });
    }
    catch (err) {
        console.error("❌ [getTeachers] error:", err);
        return res.status(500).json({
            success: false,
            message: "Không thể lấy danh sách giáo viên",
            errorDetail: err?.message ?? String(err),
        });
    }
};
exports.getTeachers = getTeachers;
exports.default = exports.getTeachers;
