import { Router } from "express";
import Teacher from "../../models/teacherModel";
import { createTeacher } from "../../controllers/admin/teacher/createTeacher";

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
    res.json(teacher);
  } catch (err) {
    next(err);
  }
});

// 📌 Xóa giáo viên
router.delete("/:id", async (req, res, next) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: "Không tìm thấy giáo viên" });
    }
    res.json({ message: "Đã xóa giáo viên" });
  } catch (err) {
    next(err);
  }
});

export default router;
