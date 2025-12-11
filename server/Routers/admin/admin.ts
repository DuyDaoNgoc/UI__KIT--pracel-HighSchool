import { Router, Request, Response } from "express";
import { verifyToken, requireAdmin } from "../../middleware/authMiddleware";
import { connectDB } from "../../configs/db";
import { ObjectId } from "mongodb";
import { createStudent } from "../../controllers/admin/student/createStudent";
import { resetUserPasswordByAdmin } from "../../controllers/admin/userAdmin";
import Payment from "../../models/Payment";
import Grade from "../../models/Grade";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import User from "../../models/User";

const router = Router();

// ===== Interface =====
interface IGradesLock {
  _id: string;
  locked: boolean;
}

// ===== Quản lý học sinh =====
// Tạo học sinh
router.post("/students/create", verifyToken, requireAdmin, createStudent);

// Gửi lại email mật khẩu cho học sinh
router.post(
  "/students/:studentId/resend-password-email",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;

      // Tìm user theo studentId
      const user = await User.findOne({ studentId });
      if (!user || !user.email) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy học sinh hoặc email không có",
        });
      }

      // Mật khẩu mặc định là studentId
      const rawPassword = studentId;

      // Gửi email nếu có SMTP
      let emailSent = false;
      try {
        if (process.env.SMTP_HOST) {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: (process.env.SMTP_SECURE || "false") === "true",
            auth: process.env.SMTP_USER
              ? {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASS,
                }
              : undefined,
          });

          await transporter.sendMail({
            from:
              process.env.SMTP_FROM ||
              `no-reply@${process.env.DOMAIN || "local"}`,
            to: user.email,
            subject: "[Hệ thống] Mật khẩu tài khoản học sinh",
            text: `Tài khoản của bạn:\nMã: ${studentId}\nEmail: ${user.email}\nMật khẩu: ${rawPassword}\n\nVui lòng đăng nhập và đổi mật khẩu ngay.`,
            html: `<p>Tài khoản của bạn:</p>
<ul>
<li><strong>Mã:</strong> ${studentId}</li>
<li><strong>Email:</strong> ${user.email}</li>
<li><strong>Mật khẩu:</strong> ${rawPassword}</li>
</ul>
<p>Vui lòng đăng nhập và đổi mật khẩu ngay.</p>`,
          });

          emailSent = true;
          console.log(
            `✅ Password email sent to ${user.email} for ${studentId}`,
          );
        } else {
          console.log(
            `⚠️ SMTP not configured. Password for ${studentId}: ${rawPassword}`,
          );
        }
      } catch (mailErr) {
        console.warn("Could not send password email:", mailErr);
      }

      return res.status(200).json({
        success: true,
        message: emailSent
          ? "Email mật khẩu đã được gửi"
          : "SMTP chưa cấu hình, hiển thị mật khẩu dưới đây",
        email: user.email,
        rawPassword: emailSent ? null : rawPassword,
        emailSent,
      });
    } catch (err: any) {
      console.error("❌ Resend password email error:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi gửi email mật khẩu",
        error: err?.message,
      });
    }
  },
);

// Admin reset user password (by user _id or by studentId/teacherId)
router.post(
  "/users/reset-password",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId, studentId, teacherId, useCode } = req.body;
      const result = await resetUserPasswordByAdmin({
        userId,
        studentId,
        teacherId,
        useCode,
      });
      return res.json(result);
    } catch (err) {
      console.error("❌ Admin reset-password error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Lấy danh sách học sinh
router.get(
  "/students",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const students = await db
        .collection("students")
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      const formattedStudents = students.map((student: any) => ({
        _id: student._id,
        name: student.name,
        dob: student.dob,
        address: student.address,
        residence: student.residence,
        phone: student.phone,
        gender: student.gender,
        email: student.email,
        grade: student.grade,
        classLetter: student.classLetter,
        major: student.major,
        schoolYear: student.schoolYear,
        studentId: student.studentId,
        classCode: student.classCode,
        className: student.className,
        teacherId: student.teacherId,
        parentId: student.parentId,
        avatar: student.avatar,
        role: student.role,
        createdAt: student.createdAt || null,
        updatedAt: student.updatedAt || null,
      }));
      res.json(formattedStudents);
    } catch (err) {
      console.error("❌ GET /students error:", err);
      res
        .status(500)
        .json({ message: "Lỗi lấy danh sách học sinh", error: err });
    }
  },
);

// ✅ Xoá học sinh
router.delete(
  "/students/:id",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const students = db.collection("students");
      const { id } = req.params;

      console.log("[DELETE /students/:id] id:", id);

      if (!id) {
        return res.status(400).json({ message: " Thiếu ID học sinh để xoá" });
      }

      // Hỗ trợ cả _id (ObjectId) lẫn studentId (string)
      let filter;
      if (ObjectId.isValid(id)) {
        filter = { _id: new ObjectId(id) };
      } else {
        filter = { studentId: id };
      }

      console.log("[DELETE /students/:id] filter:", filter);
      const result = await students.deleteOne(filter);
      console.log("[DELETE /students/:id] result:", result);

      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ message: " Không tìm thấy học sinh để xoá" });
      }

      const allStudents = await students
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      return res.json({
        message: " Xoá học sinh thành công",
        students: allStudents,
      });
    } catch (err) {
      console.error("❌ DELETE /students/:id error:", err);
      res.status(500).json({ message: "Lỗi xoá học sinh", error: err });
    }
  },
);

// Create user account for existing student (admin)
router.post(
  "/students/:studentId/create-user",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      if (!studentId) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu studentId" });
      }

      const db = await connectDB();
      const students = db.collection("students");

      // Support both ObjectId and studentId string
      const filter = ObjectId.isValid(studentId)
        ? { _id: new ObjectId(studentId) }
        : { studentId };

      const student = await students.findOne(filter);
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy học sinh" });
      }

      // Check existing user
      const existing = await User.findOne({
        $or: [{ studentId: student.studentId }, { email: student.email }],
      });
      if (existing) {
        return res.json({
          success: false,
          message: "User already exists for this student",
          userExists: true,
        });
      }

      const rawPassword = String(
        student.studentId || Math.random().toString(36).slice(-8),
      );
      const hashed = await bcrypt.hash(rawPassword, 10);

      const userDoc = await User.create({
        username: student.name || student.username || student.studentId,
        email: student.email || "",
        password: hashed,
        role: "student",
        studentId: student.studentId,
        createdAt: new Date(),
      } as any);

      let emailSent = false;
      try {
        if (process.env.SMTP_HOST && student.email) {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: (process.env.SMTP_SECURE || "false") === "true",
            auth: process.env.SMTP_USER
              ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
              : undefined,
          });

          await transporter.sendMail({
            from:
              process.env.SMTP_FROM ||
              `no-reply@${process.env.DOMAIN || "local"}`,
            to: student.email,
            subject: "[Hệ thống] Tài khoản học sinh",
            text: `Tài khoản đã được tạo. Mã: ${student.studentId}\nEmail: ${student.email}\nMật khẩu: ${rawPassword}`,
          });

          emailSent = true;
        } else {
          console.log(
            `Auto-created user for ${student.email || student.studentId} with password: ${rawPassword}`,
          );
          emailSent = false;
        }
      } catch (mailErr) {
        console.warn("Could not send student account email:", mailErr);
        emailSent = false;
      }

      return res.json({
        success: true,
        message: "User created",
        emailSent,
        rawPassword,
        user: userDoc,
      });
    } catch (err: any) {
      console.error("❌ POST /students/:studentId/create-user error:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi tạo user từ học sinh",
        error: err?.message || String(err),
      });
    }
  },
);

// ===== Quản lý giáo viên (Admin) =====
// Lấy danh sách giáo viên
router.get(
  "/teachers",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const teachers = await db
        .collection("teachers")
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      const formattedTeachers = teachers.map((teacher: any) => ({
        _id: teacher._id,
        name: teacher.name,
        dob: teacher.dob,
        gender: teacher.gender,
        phone: teacher.phone,
        email: teacher.email,
        address: teacher.address,
        majors: teacher.majors,
        subjectClasses: teacher.subjectClasses,
        assignedClass: teacher.assignedClass,
        createdAt: teacher.createdAt || null,
        updatedAt: teacher.updatedAt || null,
      }));
      res.json(formattedTeachers);
    } catch (err) {
      console.error("❌ GET /admin/teachers error:", err);
      res
        .status(500)
        .json({ message: "Lỗi lấy danh sách giáo viên", error: err });
    }
  },
);

// Create user account for existing teacher (admin)
router.post(
  "/teachers/:teacherId/create-user",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { teacherId } = req.params;
      if (!teacherId) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu teacherId" });
      }

      const db = await connectDB();
      const teachers = db.collection("teachers");

      // Support both ObjectId and teacherId string
      const filter = ObjectId.isValid(teacherId)
        ? { _id: new ObjectId(teacherId) }
        : { teacherId };

      const teacher = await teachers.findOne(filter);
      if (!teacher) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy giáo viên" });
      }

      // Check existing user
      const existing = await User.findOne({
        $or: [{ teacherId: teacher.teacherId }, { email: teacher.email }],
      });
      if (existing) {
        return res.json({
          success: false,
          message: "User already exists for this teacher",
          userExists: true,
        });
      }

      const rawPassword = String(
        teacher.teacherId || Math.random().toString(36).slice(-8),
      );
      const hashed = await bcrypt.hash(rawPassword, 10);

      const userDoc = await User.create({
        username: teacher.name || teacher.teacherId,
        email: teacher.email || "",
        password: hashed,
        role: "teacher",
        teacherId: teacher.teacherId,
        createdAt: new Date(),
      } as any);

      let emailSent = false;
      try {
        if (process.env.SMTP_HOST && teacher.email) {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: (process.env.SMTP_SECURE || "false") === "true",
            auth: process.env.SMTP_USER
              ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
              : undefined,
          });

          await transporter.sendMail({
            from:
              process.env.SMTP_FROM ||
              `no-reply@${process.env.DOMAIN || "local"}`,
            to: teacher.email,
            subject: "[Hệ thống] Tài khoản giáo viên",
            text: `Tài khoản đã được tạo. Mã: ${teacher.teacherId}\nEmail: ${teacher.email}\nMật khẩu: ${rawPassword}`,
          });

          emailSent = true;
        } else {
          console.log(
            `Auto-created user for ${teacher.email || teacher.teacherId} with password: ${rawPassword}`,
          );
          emailSent = false;
        }
      } catch (mailErr) {
        console.warn("Could not send teacher account email:", mailErr);
        emailSent = false;
      }

      return res.json({
        success: true,
        message: "User created",
        emailSent,
        rawPassword,
        user: userDoc,
      });
    } catch (err: any) {
      console.error("❌ POST /teachers/:teacherId/create-user error:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi tạo user từ giáo viên",
        error: err?.message || String(err),
      });
    }
  },
);

// ===== Quản lý khóa điểm =====
router.get(
  "/grades/status",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const settings = db.collection<IGradesLock>("settings");

      let lockDoc = await settings.findOne({ _id: "gradesLockStatus" });
      if (!lockDoc) {
        const newLockDoc: IGradesLock = {
          _id: "gradesLockStatus",
          locked: false,
        };
        await settings.insertOne(newLockDoc);
        lockDoc = newLockDoc;
      }

      res.json({ locked: lockDoc.locked });
    } catch (err) {
      console.error("❌ GET /grades/status error:", err);
      res
        .status(500)
        .json({ message: "Lỗi lấy trạng thái khóa điểm", error: err });
    }
  },
);

router.post(
  "/grades/lock",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const settings = db.collection<IGradesLock>("settings");
      await settings.updateOne(
        { _id: "gradesLockStatus" },
        { $set: { locked: true } },
        { upsert: true },
      );
      res.json({ message: " Grades locked", locked: true });
    } catch (err) {
      console.error("❌ POST /grades/lock error:", err);
      res.status(500).json({ message: "Lỗi khóa điểm", error: err });
    }
  },
);

router.post(
  "/grades/unlock",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const settings = db.collection<IGradesLock>("settings");
      await settings.updateOne(
        { _id: "gradesLockStatus" },
        { $set: { locked: false } },
        { upsert: true },
      );
      res.json({ message: " Grades unlocked", locked: false });
    } catch (err) {
      console.error("❌ POST /grades/unlock error:", err);
      res.status(500).json({ message: "Lỗi mở khóa điểm", error: err });
    }
  },
);

// ===== Quản lý tin tức =====
router.get(
  "/news/pending",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const news = await db
        .collection("news")
        .find({ status: "pending" })
        .toArray();
      res.json(news);
    } catch (err) {
      console.error("❌ GET /news/pending error:", err);
      res
        .status(500)
        .json({ message: "Lỗi lấy tin tức chờ duyệt", error: err });
    }
  },
);

router.post(
  "/news/:id/approve",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const newsId = new ObjectId(req.params.id);
      await db
        .collection("news")
        .updateOne({ _id: newsId }, { $set: { status: "approved" } });
      res.json({ message: " News approved" });
    } catch (err) {
      console.error("❌ POST /news/:id/approve error:", err);
      res.status(500).json({ message: "Lỗi duyệt tin tức", error: err });
    }
  },
);

router.post(
  "/news/:id/reject",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const newsId = new ObjectId(req.params.id);
      await db
        .collection("news")
        .updateOne({ _id: newsId }, { $set: { status: "rejected" } });
      res.json({ message: " News rejected" });
    } catch (err) {
      console.error("❌ POST /news/:id/reject error:", err);
      res.status(500).json({ message: "Lỗi từ chối tin tức", error: err });
    }
  },
);

// ===== Đồng bộ dữ liệu =====
// Sync all teachers and students to users collection
router.post(
  "/sync/users",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const teachers = await db.collection("teachers").find().toArray();
      const students = await db.collection("students").find().toArray();
      const users = db.collection("users");

      let syncedTeachers = 0;
      let syncedStudents = 0;

      // Sync teachers
      for (const teacher of teachers) {
        if (!teacher.teacherId) continue;

        const updatePayload: any = {
          dob: teacher.dob,
          phone: teacher.phone,
          address: teacher.address,
          major: teacher.major || teacher.majors,
          assignedClass: teacher.assignedClass || [],
        };

        // Remove undefined
        Object.keys(updatePayload).forEach((key) => {
          if (updatePayload[key] === undefined) delete updatePayload[key];
        });

        const result = await users.updateOne(
          { teacherId: teacher.teacherId },
          { $set: updatePayload },
          { upsert: false },
        );

        if (result.modifiedCount > 0) syncedTeachers++;
      }

      // Sync students
      for (const student of students) {
        if (!student.studentId) continue;

        const updatePayload: any = {
          dob: student.dob,
          phone: student.phone,
          address: student.address,
          residence: student.residence,
          schoolYear: student.schoolYear,
          gender: student.gender,
          classCode: student.classCode || student.classLetter,
          major: student.major,
          grade: student.grade,
        };

        // Remove undefined
        Object.keys(updatePayload).forEach((key) => {
          if (updatePayload[key] === undefined) delete updatePayload[key];
        });

        const result = await users.updateOne(
          { studentId: student.studentId },
          { $set: updatePayload },
          { upsert: false },
        );

        if (result.modifiedCount > 0) syncedStudents++;
      }

      return res.json({
        success: true,
        message: `✅ Đồng bộ hoàn tất: ${syncedTeachers} giáo viên, ${syncedStudents} học sinh`,
        syncedTeachers,
        syncedStudents,
      });
    } catch (err: any) {
      console.error("❌ POST /sync/users error:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi đồng bộ dữ liệu",
        error: err?.message || String(err),
      });
    }
  },
);

// ✅ Sync emails from `users` collection back into `students` and `teachers`
router.post(
  "/sync/emails",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const users = db.collection("users");
      const students = db.collection("students");
      const teachers = db.collection("teachers");

      // Find users that have email and either studentId or teacherId
      const cursor = users.find({
        email: { $exists: true, $ne: "" },
        $or: [
          { studentId: { $exists: true } },
          { teacherId: { $exists: true } },
        ],
      });

      let updatedStudents = 0;
      let updatedTeachers = 0;

      while (await cursor.hasNext()) {
        const u = await cursor.next();
        if (!u) continue;
        const email = String(u.email || "")
          .trim()
          .toLowerCase();

        if (u.studentId) {
          const result = await students.updateOne(
            { studentId: u.studentId },
            { $set: { email } },
          );
          if (result.modifiedCount > 0) updatedStudents++;
        }

        if (u.teacherId) {
          const result = await teachers.updateOne(
            { teacherId: u.teacherId },
            { $set: { email } },
          );
          if (result.modifiedCount > 0) updatedTeachers++;
        }
      }

      return res.json({
        success: true,
        message: "Đã đồng bộ email từ users vào students và teachers",
        updatedStudents,
        updatedTeachers,
      });
    } catch (err: any) {
      console.error("❌ POST /admin/sync/emails error:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi sync emails",
        error: err?.message || String(err),
      });
    }
  },
);

export default router;

// ===== Thống kê học phí & điểm theo năm (Admin) =====
// Trả về mảng 12 phần tử (tháng 1..12) với tổng theo tháng
router.get(
  "/stats/tuition",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const year = parseInt(
        (req.query.year as string) || String(new Date().getFullYear()),
        10,
      );
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);

      const pipeline = [
        { $match: { status: "paid", date: { $gte: start, $lt: end } } },
        {
          $group: {
            _id: { month: { $month: "$date" } },
            total: { $sum: "$amount" },
          },
        },
      ];

      const results: any[] = await Payment.aggregate(pipeline as any);

      const months = Array.from({ length: 12 }, (_, i) => {
        const found = results.find((r) => r._id.month === i + 1);
        return found ? found.total : 0;
      });

      res.json({ year, months });
    } catch (err) {
      console.error("❌ GET /admin/stats/tuition error:", err);
      res
        .status(500)
        .json({ success: false, message: "Lỗi thống kê học phí", error: err });
    }
  },
);

router.get(
  "/stats/scores",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const year = parseInt(
        (req.query.year as string) || String(new Date().getFullYear()),
        10,
      );
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);

      // Group by month of updatedAt (or createdAt)
      const pipeline = [
        { $match: { updatedAt: { $gte: start, $lt: end } } },
        {
          $group: {
            _id: { month: { $month: "$updatedAt" } },
            totalScore: { $sum: "$score" },
            avgScore: { $avg: "$score" },
          },
        },
      ];

      const results: any[] = await Grade.aggregate(pipeline as any);

      const monthsTotal = Array.from({ length: 12 }, (_, i) => {
        const found = results.find((r) => r._id.month === i + 1);
        return found ? found.totalScore : 0;
      });

      const monthsAvg = Array.from({ length: 12 }, (_, i) => {
        const found = results.find((r) => r._id.month === i + 1);
        return found ? Math.round(found.avgScore * 100) / 100 : 0;
      });

      res.json({ year, monthsTotal, monthsAvg });
    } catch (err) {
      console.error("❌ GET /admin/stats/scores error:", err);
      res
        .status(500)
        .json({ success: false, message: "Lỗi thống kê điểm", error: err });
    }
  },
);
