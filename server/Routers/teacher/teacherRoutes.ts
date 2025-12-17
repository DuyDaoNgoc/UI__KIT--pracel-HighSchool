import { Router } from "express";
import Teacher from "../../models/teacherModel";
import User from "../../models/User";
import { createTeacher } from "../../controllers/admin/teacher/createTeacher";
import { syncTeacherToUser } from "../../utils/syncUserData";
const router = Router();
// 📌 Lấy danh sách giáo viên
router.get("/", async (req, res, next) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    next(err);
  }
});
// 📌 Thêm giáo viên mới (dùng controller có auto teacherId)
router.post("/", createTeacher);

// 📌 Sửa thông tin giáo viên
router.put("/:id", async (req, res, next) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!teacher) {
      return res.status(404).json({ message: "Không tìm thấy giáo viên" });
    }
    // Auto-sync teacher changes to users collection
    await syncTeacherToUser(teacher);
    res.json(teacher);
  } catch (err) {
    next(err);
  }
});
//  Xóa giáo viên
router.delete("/:id", async (req, res, next) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: "Không tìm thấy giáo viên" });
    }

    // 🔥 Xóa tài khoản User liên quan (nếu có)
    try {
      const deleteUserResult = await User.deleteOne({
        $or: [{ teacherId: teacher.teacherId }, { email: teacher.email }],
      });
      if (deleteUserResult.deletedCount > 0) {
        console.log(`✅ Xóa tài khoản user cho giáo viên ${teacher.teacherId}`);
      }
    } catch (userErr) {
      console.warn(
        `⚠️ Lỗi khi xóa tài khoản user cho ${teacher.teacherId}:`,
        userErr,
      );
    }

    res.json({ message: "Đã xóa giáo viên và tài khoản liên quan" });
  } catch (err) {
    next(err);
  }
});

export default router;
