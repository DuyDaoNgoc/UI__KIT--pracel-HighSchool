// server/controllers/admin/deleteStudent.ts
import { Request, Response } from "express";
import { connectDB } from "../../../configs/db";
import { ObjectId } from "mongodb";
import User from "../../../models/User";

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

    // ✅ Gỡ học sinh khỏi lớp - cố gắng gỡ ở mọi nơi (kể cả khi thiếu thông tin lớp)
    try {
      // 1) Nếu lớp đầy đủ thông tin, cố gắng gỡ ở lớp đó (tối ưu)
      if (student.schoolYear && student.classLetter && student.major) {
        const majorAbbrev = (student.major || "")
          .split(/\s+/)
          .map((w: string) => w[0]?.toUpperCase() || "")
          .join("");

        const classCode = `${student.schoolYear}${student.classLetter}${majorAbbrev}`;

        await classes.updateOne(
          { classCode, schoolYear: student.schoolYear, major: student.major },
          { $pull: { studentIds: { _id: new ObjectId(student._id) } } } as any,
        );

        await classes.updateOne(
          { classCode, schoolYear: student.schoolYear, major: student.major },
          { $pull: { studentIds: new ObjectId(student._id) } } as any,
        );
      }

      // 2) Dọn dẹp toàn bộ classes: remove entries that may be stored in different formats
      // - subdocuments like { _id: ObjectId, studentId: '26A...' }
      // - raw ObjectId values
      // - string studentId values
      await classes.updateMany({}, {
        $pull: { studentIds: { _id: new ObjectId(student._id) } },
      } as any);
      await classes.updateMany({}, {
        $pull: { studentIds: new ObjectId(student._id) },
      } as any);
      if (student.studentId) {
        await classes.updateMany({}, {
          $pull: { studentIds: student.studentId },
        } as any);
        // also pull subdocuments where field studentId equals student.studentId
        await classes.updateMany({}, {
          $pull: { studentIds: { studentId: student.studentId } },
        } as any);

        // additional formats: some codebases store different key names or stringified _id
        try {
          // raw string of ObjectId
          await classes.updateMany({}, {
            $pull: { studentIds: String(student._id) },
          } as any);

          // subdocument field variants
          await classes.updateMany({}, {
            $pull: { studentIds: { id: student.studentId } },
          } as any);
          await classes.updateMany({}, {
            $pull: { studentIds: { student_id: student.studentId } },
          } as any);
          await classes.updateMany({}, {
            $pull: { studentIds: { sid: student.studentId } },
          } as any);
          // sometimes stored as { id: ObjectId }
          await classes.updateMany({}, {
            $pull: { studentIds: { id: new ObjectId(student._id) } },
          } as any);
        } catch (extraErr) {
          console.warn("⚠️ Lỗi khi gỡ các định dạng studentId khác:", extraErr);
        }
      }
    } catch (pullErr) {
      console.warn("⚠️ Lỗi khi gỡ học sinh khỏi classes (cleanup):", pullErr);
    }

    const result = await students.deleteOne(filter);
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "❌ Không tìm thấy học sinh để xóa",
      });
    }

    // 🔥 Xóa tài khoản User liên quan (nếu có)
    try {
      const deleteUserResult = await User.deleteOne({
        $or: [{ studentId: student.studentId }, { email: student.email }],
      });
      if (deleteUserResult.deletedCount > 0) {
        console.log(`✅ Xóa tài khoản user cho học sinh ${student.studentId}`);
      }
    } catch (userErr) {
      console.warn(
        `⚠️ Lỗi khi xóa tài khoản user cho ${student.studentId}:`,
        userErr,
      );
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
