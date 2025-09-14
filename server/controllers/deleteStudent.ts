// server/controllers/admin/deleteStudent.ts
import { Request, Response } from "express";
import { connectDB } from "../configs/db";
import { ObjectId } from "mongodb";

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
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
    if (ObjectId.isValid(id)) {
      filter = { _id: new ObjectId(id) };
    } else {
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
  } catch (error) {
    console.error("❌ deleteStudent error:", error);
    return res.status(500).json({
      success: false,
      message: "❌ Lỗi server khi xóa học sinh",
      error: (error as Error).message,
    });
  }
};
