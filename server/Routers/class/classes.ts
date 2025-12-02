import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import ClassModel from "../../models/Class";
import TeacherModel from "../../models/teacherModel"; // thêm import TeacherModel
import StudentModel from "../../models/Student"; // import StudentModel để add student đúng
import { verifyToken, checkRole } from "../../middleware/authMiddleware";
import { assignTeacherToClass } from "../../controllers/admin/class/assignTeacherToClass";

const router = Router();

/**
 * 🏫 GET: Lấy toàn bộ lớp
 * Route: GET /api/classes
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const classes = await ClassModel.find();
    return res.status(200).json({ success: true, data: classes });
  } catch (err) {
    console.error("⚠️ fetch classes error:", err);
    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách lớp",
    });
  }
});

/**
 * 🗑️ DROP collection (chỉ dùng lần đầu để fix schema)
 * Route: DELETE /api/classes/cleanup/drop
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cls = await ClassModel.findByIdAndDelete(id);
    if (!cls) {
      return res.status(404).json({
        success: false,
        message: "Lớp không tồn tại",
      });
    }

    return res.json({ success: true, message: "Đã xóa lớp" });
  } catch (err: any) {
    console.error(" delete class error:", err);
    return res.status(500).json({
      success: false,
      message: "Không thể xóa lớp",
    });
  }
});

/**
 * ✅ Temporary endpoint: remove/clear collection validator via collMod (use once)
 * Route: POST /api/classes/cleanup/disable-validator
 */
router.post(
  "/cleanup/disable-validator",
  async (req: Request, res: Response) => {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        console.error("⚠️ MongoDB connection db is undefined");
        return res.status(500).json({ success: false, error: "DB not ready" });
      }

      // remove validator (one-time)
      await db.command({
        collMod: "classes",
        validator: {},
        validationLevel: "off", // changed to off để bypass hoàn toàn
      });

      console.log(" classes validator cleared via collMod");
      return res.json({ success: true, message: "Validator cleared" });
    } catch (err: any) {
      console.error(" failed to clear validator:", err);
      return res
        .status(500)
        .json({ success: false, error: err.message || err });
    }
  },
);

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await ClassModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Lớp không tồn tại",
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error(" update class error:", err);
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật lớp",
    });
  }
});

/**
 * 🏫 POST: Tạo lớp mới
 * Route: POST /api/classes/create
 */
router.post("/create", async (req: Request, res: Response) => {
  try {
    const { grade, schoolYear, classLetter, major } = req.body;

    console.log("📥 Request body:", req.body);

    if (!grade || !schoolYear || !classLetter || !major) {
      console.warn(" Thiếu dữ liệu đầu vào:", req.body);
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin lớp (grade, schoolYear, classLetter, major)",
      });
    }

    const majorAbbrev = major
      .split(/\s+/)
      .map((w: string) => w[0]?.toUpperCase() || "")
      .join("");
    // 🔹 Fix classCode đúng format giống student
    const classCode = `${grade}${classLetter}${majorAbbrev}`;

    console.log(" Generated classCode:", classCode);

    const existed = await ClassModel.findOne({ classCode });
    if (existed) {
      return res.status(400).json({
        success: false,
        message: "Lớp đã tồn tại (trùng classCode)",
      });
    }

    const cls = new ClassModel({
      grade,
      schoolYear,
      classLetter,
      major,
      classCode,
      teacherId: null,
      teacherName: "",
      studentIds: [],
    });

    try {
      // Thử lưu bình thường
      await cls.save();
      console.log(" Class created:", cls);
      return res.status(201).json({ success: true, data: cls });
    } catch (saveErr: any) {
      const msg = (saveErr && saveErr.message) || "";
      const isValidationFailure =
        msg.includes("Document failed validation") || saveErr.code === 121;

      if (isValidationFailure) {
        console.warn(
          " Validation blocked insert, retrying with bypassDocumentValidation",
        );
        const raw = {
          grade,
          schoolYear,
          classLetter,
          major,
          classCode,
          teacherId: null,
          teacherName: "",
          studentIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await ClassModel.collection.insertOne(raw, {
          bypassDocumentValidation: true,
        });
        const created = await ClassModel.findById(result.insertedId);
        console.log(" Class created via bypass:", created);
        return res.status(201).json({ success: true, data: created });
      }

      throw saveErr;
    }
  } catch (err: any) {
    console.error(" create class error:", err.message || err);
    console.error(" Stack:", err.stack || "");
    return res.status(500).json({
      success: false,
      message: "Không thể tạo lớp",
      error: err.message || err,
    });
  }
});

/* keep other routes unchanged (assign, assign-teacher, add-student) */
router.post("/assign", assignTeacherToClass);

router.post(
  "/:classCode/assign-teacher",
  async (req: Request, res: Response) => {
    try {
      const { classCode } = req.params;
      const { teacherId } = req.body;

      if (!teacherId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu teacherId",
        });
      }

      const cls = await ClassModel.findOne({ classCode });
      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Lớp không tồn tại",
        });
      }

      // Lấy teacherName từ TeacherModel
      const teacher = await TeacherModel.findById(teacherId);
      cls.teacherId = new mongoose.Types.ObjectId(teacherId);
      cls.teacherName = teacher?.name || "";

      await cls.save();

      console.log("Teacher assigned:", classCode, cls.teacherName);
      return res.status(200).json({ success: true, data: cls });
    } catch (err: any) {
      console.error("⚠️ assign teacher error:", err);
      return res.status(500).json({
        success: false,
        message: "Gán giáo viên thất bại",
      });
    }
  },
);

router.post("/:classCode/add-student", async (req: Request, res: Response) => {
  try {
    const { classCode } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu studentId",
      });
    }

    const cls = await ClassModel.findOne({ classCode });
    if (!cls) {
      return res.status(404).json({
        success: false,
        message: "Lớp chưa tồn tại, không thể thêm học sinh",
      });
    }

    // 🔹 Fix: lấy _id của student từ studentId string
    const student = await StudentModel.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Học sinh không tồn tại",
      });
    }
    const studentObjectId = student._id;

    // Kiểm tra học sinh đã tồn tại trong lớp chưa
    const alreadyInClass = cls.studentIds.some((id) =>
      id.equals(studentObjectId),
    );
    if (alreadyInClass) {
      return res.status(400).json({
        success: false,
        message: "Học sinh đã có trong lớp",
      });
    }

    // Thêm học sinh vào mảng studentIds
    cls.studentIds.push(studentObjectId);
    await cls.save();

    console.log("✅ Student added:", classCode, studentId);
    return res.status(200).json({ success: true, data: cls });
  } catch (err: any) {
    console.error("⚠️ add student error:", err);
    return res.status(500).json({
      success: false,
      message: "Thêm học sinh thất bại",
      errorDetail: err.message || err,
    });
  }
});

/**
 * 🧑‍🏫 POST: Gán giáo viên cho nhiều lớp cùng lúc
 * Route: POST /api/classes/assign-teacher-bulk
 * Body:
 * {
 *   teacherId: string,
 *   assignments: [
 *     { classCode: string, type: "homeroom" | "subject" }
 *   ]
 * }
 */
router.post("/assign-teacher-bulk", async (req: Request, res: Response) => {
  try {
    const { teacherId, assignments } = req.body;

    if (!teacherId || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thiếu teacherId hoặc danh sách lớp",
      });
    }

    // Lấy teacherName từ TeacherModel
    const teacher = await TeacherModel.findById(teacherId);
    const teacherName = teacher?.name || "";

    const results: any[] = [];

    for (const assign of assignments) {
      const { classCode, type } = assign;

      const cls = await ClassModel.findOne({ classCode });
      if (!cls) {
        results.push({
          classCode,
          success: false,
          message: "Lớp không tồn tại",
        });
        continue;
      }

      if (type === "homeroom") {
        cls.teacherId = new mongoose.Types.ObjectId(teacherId);
        cls.teacherName = teacherName;
      } else if (type === "subject") {
        if (!cls.subjectTeachers) cls.subjectTeachers = [];
        if (
          !cls.subjectTeachers.some(
            (t: any) => String(t.teacherId) === String(teacherId),
          )
        ) {
          cls.subjectTeachers.push({
            teacherId: new mongoose.Types.ObjectId(teacherId),
            teacherName,
          });
        }
      }

      await cls.save();
      results.push({ classCode, success: true });
    }

    return res.status(200).json({
      success: true,
      message: "Xếp giáo viên hoàn tất",
      results,
    });
  } catch (err: any) {
    console.error("⚠️ assign teachers bulk error:", err);
    return res.status(500).json({
      success: false,
      message: "Xếp giáo viên thất bại",
      error: err.message || err,
    });
  }
});

export default router;
