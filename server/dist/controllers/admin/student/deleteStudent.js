"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudent = void 0;
const db_1 = require("../../../configs/db");
const mongodb_1 = require("mongodb");
const deleteStudent = async (req, res) => {
    try {
        const db = await (0, db_1.connectDB)();
        const students = db.collection("students");
        // ✅ Lấy id từ params
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "❌ Thiếu ID học sinh để xóa",
            });
        }
        let filter;
        // Nếu id là ObjectId hợp lệ thì tìm theo _id
        if (mongodb_1.ObjectId.isValid(id)) {
            filter = { _id: new mongodb_1.ObjectId(id) };
        }
        else {
            // Nếu không phải ObjectId, cho phép xoá theo studentId
            filter = { studentId: id };
        }
        const result = await students.deleteOne(filter);
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "❌ Không tìm thấy học sinh để xóa",
            });
        }
        // Trả danh sách mới sau khi xóa
        const allStudents = await students
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        return res.json({
            success: true,
            message: "✅ Xóa học sinh thành công",
            students: allStudents,
        });
    }
    catch (error) {
        console.error("❌ deleteStudent error:", error);
        return res.status(500).json({
            success: false,
            message: "❌ Lỗi server khi xóa học sinh",
            error: error.message,
        });
    }
};
exports.deleteStudent = deleteStudent;
