"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeacher = void 0;
const teacherModel_1 = __importDefault(require("../../../models/teacherModel"));
const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = { ...req.body };
        delete payload._id;
        delete payload.teacherId;
        // Convert dob
        if (payload.dob && !isNaN(Date.parse(payload.dob))) {
            payload.dob = new Date(payload.dob);
        }
        // Handle assignedClass
        if (payload.assignedClassCode?.trim()) {
            const classCode = payload.assignedClassCode.trim();
            // Check lớp đã được gán chưa
            const existed = await teacherModel_1.default.findOne({
                assignedClassCode: classCode,
                _id: { $ne: id },
            });
            if (existed) {
                return res.status(409).json({
                    success: false,
                    message: `Lớp ${classCode} đã được gán cho giáo viên khác`,
                });
            }
            payload.assignedClass = {
                grade: "",
                classLetter: "",
                major: "",
                schoolYear: "",
                classCode,
            };
        }
        else {
            payload.assignedClass = null;
            payload.assignedClassCode = null;
        }
        const updated = await teacherModel_1.default.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        }).lean();
        if (!updated)
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy giáo viên",
            });
        return res.json({
            success: true,
            message: "Cập nhật giáo viên thành công",
            data: updated,
        });
    }
    catch (err) {
        console.error("❌ [updateTeacher] error:", err);
        return res.status(500).json({
            success: false,
            message: "Không thể cập nhật giáo viên",
            errorDetail: err?.message ?? String(err),
        });
    }
};
exports.updateTeacher = updateTeacher;
exports.default = exports.updateTeacher;
