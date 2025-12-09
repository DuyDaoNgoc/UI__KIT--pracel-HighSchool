// server/controllers/admin/deleteStudent.ts
import { Request, Response } from "express";
import { connectDB } from "../../../configs/db";
import { ObjectId } from "mongodb";

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const students = db.collection("students");
    const classes = db.collection("classes");

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "❌ Thiếu ID học sinh để xóa",
      });
    }

    const filter = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { studentId: id };

    const student = await students.findOne(filter);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "❌ Không tìm thấy học sinh để xóa",
      });
    }

    // ✅ Gỡ học sinh khỏi lớp nếu có đầy đủ thông tin
    if (student.schoolYear && student.classLetter && student.major) {
      const majorAbbrev = (student.major || "")
        .split(/\s+/)
        .map((w: string) => w[0]?.toUpperCase() || "")
        .join("");

      const classCode = `${student.schoolYear}${student.classLetter}${majorAbbrev}`;

      await classes.updateOne(
        { classCode, schoolYear: student.schoolYear, major: student.major },
        {
          $pull: {
            studentIds: ObjectId.isValid(student._id)
              ? new ObjectId(student._id)
              : student._id,
          },
        },
      );
    }

    const result = await students.deleteOne(filter);
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "❌ Không tìm thấy học sinh để xóa",
      });
    }

    const allStudents = await students
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({
      success: true,
      message: "✅ Xóa học sinh thành công và gỡ khỏi lớp",
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
