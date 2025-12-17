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
import { getIo } from "../../utils/socketio";

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

      // Emit student deleted event to admins and the student's room (if studentId known)
      try {
        const io = getIo();
        if (io) {
          // if filter keyed by studentId string
          if ((filter as any).studentId) {
            io.to(`user:${(filter as any).studentId}`).emit("student:deleted", {
              studentId: (filter as any).studentId,
            });
          }
          io.to("role:admin").emit("student:deleted", { studentId: id });
        }
      } catch (emitErr) {
        console.warn("⚠️ [admin/delete student] Socket emit failed:", emitErr);
      }

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
      const logs: string[] = [];

      // Sync teachers
      for (const teacher of teachers) {
        if (!teacher.teacherId) continue;

        const updatePayload: any = {};

        // Only sync non-empty values
        if (teacher.dob) updatePayload.dob = teacher.dob;
        if (teacher.phone && teacher.phone.trim())
          updatePayload.phone = teacher.phone;
        if (teacher.address && teacher.address.trim())
          updatePayload.address = teacher.address;
        if (teacher.major) updatePayload.major = teacher.major;
        // ✅ Sync majors array
        if (
          teacher.majors &&
          Array.isArray(teacher.majors) &&
          teacher.majors.length > 0
        ) {
          updatePayload.majors = teacher.majors;
          // Also set major string if not already set
          if (!updatePayload.major) {
            updatePayload.major = teacher.majors.join(", ");
          }
        }
        // ✅ Sync assignedClass
        if (
          teacher.assignedClass &&
          Array.isArray(teacher.assignedClass) &&
          teacher.assignedClass.length > 0
        ) {
          updatePayload.assignedClass = teacher.assignedClass;
        }

        if (Object.keys(updatePayload).length === 0) continue;

        const result = await users.updateOne(
          { teacherId: teacher.teacherId },
          { $set: updatePayload },
          { upsert: false },
        );

        if (result.modifiedCount > 0) {
          syncedTeachers++;
          logs.push(`✅ Teacher ${teacher.teacherId} synced`);
        }
      }

      // Sync students
      for (const student of students) {
        if (!student.studentId) continue;

        const updatePayload: any = {};

        // Only sync non-empty values
        if (student.dob) updatePayload.dob = student.dob;
        if (student.phone && student.phone.trim())
          updatePayload.phone = student.phone;
        if (student.address && student.address.trim())
          updatePayload.address = student.address;
        if (student.schoolYear && student.schoolYear.trim())
          updatePayload.schoolYear = student.schoolYear;
        if (student.classCode && student.classCode.trim())
          updatePayload.classCode = student.classCode;
        else if (student.classLetter && student.classLetter.trim())
          updatePayload.classCode = student.classLetter;
        if (student.major && student.major.trim())
          updatePayload.major = student.major;

        if (Object.keys(updatePayload).length === 0) continue;

        const result = await users.updateOne(
          { studentId: student.studentId },
          { $set: updatePayload },
          { upsert: false },
        );

        if (result.modifiedCount > 0) {
          syncedStudents++;
          logs.push(`✅ Student ${student.studentId} synced`);
        }
      }

      console.log(`📝 [SYNC] Logs:\n${logs.slice(0, 20).join("\n")}`);

      return res.json({
        success: true,
        message: `✅ Đồng bộ hoàn tất: ${syncedTeachers} giáo viên, ${syncedStudents} học sinh`,
        syncedTeachers,
        syncedStudents,
        sampleLogs: logs.slice(0, 10),
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

// ===== One-time cleanup: remove orphan student references from classes =====
router.post(
  "/classes/cleanup-orphan-students",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const classes = db.collection("classes");
      const users = db.collection("users");

      const cursor = classes.find();
      let classesProcessed = 0;
      let totalRemoved = 0;
      const cleanedClasses: string[] = [];

      while (await cursor.hasNext()) {
        const cls = await cursor.next();
        if (!cls) continue;
        classesProcessed++;

        const refs = Array.isArray(cls.studentIds) ? cls.studentIds : [];
        if (refs.length === 0) continue;

        const toRemove: any[] = [];

        for (const ref of refs) {
          let found = null as any;

          // Case: ObjectId or string representing ObjectId
          try {
            if (ref && (typeof ref === "object" || typeof ref === "string")) {
              // If it's an object with _id
              if (typeof ref === "object" && ref._id) {
                const maybeId = ref._id;
                if (ObjectId.isValid(maybeId)) {
                  found = await users.findOne({ _id: new ObjectId(maybeId) });
                }
              } else if (typeof ref === "object") {
                // look for common id fields inside subdocument
                const candidate = ref.studentId || ref.id || ref.sid || ref._id;
                if (candidate) {
                  if (ObjectId.isValid(candidate)) {
                    found = await users.findOne({
                      _id: new ObjectId(candidate),
                    });
                  } else {
                    found = await users.findOne({
                      studentId: String(candidate),
                    });
                  }
                }
              } else if (typeof ref === "string") {
                if (ObjectId.isValid(ref)) {
                  found = await users.findOne({ _id: new ObjectId(ref) });
                } else {
                  // assume it's a studentId code like '26A39315'
                  found = await users.findOne({ studentId: String(ref) });
                }
              }
            }
          } catch (e) {
            // ignore individual ref errors and treat as not found
            found = null;
          }

          if (!found) {
            toRemove.push(ref);
          }
        }

        if (toRemove.length > 0) {
          // Remove these exact entries from the array
          // cast update to any to satisfy TypeScript MongoDB typings for complex $pull shapes
          const result = await classes.updateOne({ _id: cls._id }, {
            $pull: { studentIds: { $in: toRemove } },
          } as unknown as any);

          if (result.modifiedCount && result.modifiedCount > 0) {
            totalRemoved += toRemove.length;
            cleanedClasses.push(cls.classCode || String(cls._id));
          }
        }
      }

      return res.json({
        success: true,
        message: `Cleanup complete. Processed ${classesProcessed} classes, removed ${totalRemoved} orphan references.`,
        classesProcessed,
        totalRemoved,
        cleanedClasses,
      });
    } catch (err: any) {
      console.error("❌ Cleanup orphan student refs error:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi dọn dẹp references học sinh",
        error: err?.message || String(err),
      });
    }
  },
);

// ✅ Debug endpoint: Get a specific student/teacher data from all collections
router.get(
  "/debug/:studentIdOrTeacherId",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { studentIdOrTeacherId } = req.params;
      const db = await connectDB();

      const student = await db
        .collection("students")
        .findOne({ studentId: studentIdOrTeacherId });
      const teacher = await db
        .collection("teachers")
        .findOne({ teacherId: studentIdOrTeacherId });
      const user = await User.findOne({
        $or: [
          { studentId: studentIdOrTeacherId },
          { teacherId: studentIdOrTeacherId },
        ],
      }).lean();

      return res.json({
        success: true,
        studentIdOrTeacherId,
        student: student
          ? {
              id: student._id,
              studentId: student.studentId,
              name: student.name,
              phone: student.phone,
              address: student.address,
              dob: student.dob,
              gender: student.gender,
              classCode: student.classCode,
              major: student.major,
              schoolYear: student.schoolYear,
              residence: student.residence,
              grade: student.grade,
            }
          : null,
        teacher: teacher
          ? {
              id: teacher._id,
              teacherId: teacher.teacherId,
              name: teacher.name,
              phone: teacher.phone,
              address: teacher.address,
              dob: teacher.dob,
              gender: teacher.gender,
              major: teacher.major,
              majors: teacher.majors,
              assignedClass: teacher.assignedClass,
            }
          : null,
        user: user
          ? {
              id: user._id,
              username: user.username,
              email: user.email,
              role: user.role,
              studentId: user.studentId,
              teacherId: user.teacherId,
              phone: user.phone,
              address: user.address,
              dob: user.dob,
              gender: user.gender,
              classCode: user.classCode,
              major: user.major,
              schoolYear: user.schoolYear,
              residence: user.residence,
              grade: user.grade,
            }
          : null,
      });
    } catch (err: any) {
      console.error("❌ Debug endpoint error:", err);
      res.status(500).json({
        success: false,
        message: "Debug error",
        error: err?.message || String(err),
      });
    }
  },
);

/**
 * 🏫 POST: Bulk assign subjects to classes
 * Route: POST /api/admin/classes/bulk-assign-subjects
 * Body: {
 *   assignments: [
 *     { classId: string, subjectId: string, teacherId: string }
 *   ]
 * }
 */
router.post(
  "/classes/bulk-assign-subjects",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { assignments } = req.body;

      if (!Array.isArray(assignments) || assignments.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Missing assignments list",
        });
      }

      const ClassModel = require("../../models/Class").default;
      const SubjectModel = require("../../models/Subject").default;
      const TeacherModel = require("../../models/teacherModel").default;

      const results: any[] = [];

      for (const assign of assignments) {
        const { classId, subjectId, teacherId } = assign;

        try {
          // Validate inputs
          if (!classId || !subjectId || !teacherId) {
            results.push({
              classId,
              success: false,
              message: "Missing classId, subjectId, or teacherId",
            });
            continue;
          }

          // Fetch class, subject, teacher
          const cls = await ClassModel.findById(classId);
          const subject = await SubjectModel.findById(subjectId);
          const teacher = await TeacherModel.findById(teacherId);

          if (!cls) {
            results.push({
              classId,
              success: false,
              message: "Class not found",
            });
            continue;
          }
          if (!subject) {
            results.push({
              classId,
              success: false,
              message: "Subject not found",
            });
            continue;
          }
          if (!teacher) {
            results.push({
              classId,
              success: false,
              message: "Teacher not found",
            });
            continue;
          }

          // Check if already assigned
          if (!cls.subjectTeachers) cls.subjectTeachers = [];
          const alreadyAssigned = cls.subjectTeachers.some(
            (st: any) =>
              String(st.subjectId) === String(subjectId) &&
              String(st.teacherId) === String(teacherId),
          );

          if (alreadyAssigned) {
            results.push({
              classId,
              success: false,
              message: `Subject already assigned to this teacher`,
            });
            continue;
          }

          // Add to subjectTeachers
          cls.subjectTeachers.push({
            subjectId: new (require("mongoose").Types.ObjectId)(subjectId),
            subjectName: subject.name,
            teacherId: new (require("mongoose").Types.ObjectId)(teacherId),
            teacherName: teacher.name,
          });

          await cls.save();

          results.push({
            classId,
            success: true,
            message: `Assigned successfully`,
          });
        } catch (assignErr: any) {
          results.push({
            classId,
            success: false,
            message: `Error: ${assignErr?.message || assignErr}`,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      res.status(200).json({
        success: true,
        message: `Assigned ${successCount}/${results.length} subject-teacher pairs`,
        successCount,
        failureCount,
        results,
      });
    } catch (err: any) {
      console.error("❌ Bulk assign subjects error:", err?.message || err);
      res.status(500).json({
        success: false,
        message: "Error bulk assigning subjects",
        error: err?.message || err,
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

// ✅ UPDATE: Update teacher majors and sync to users
router.post(
  "/teachers/:teacherId/update-majors",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { teacherId } = req.params;
      const { majors } = req.body;

      if (!teacherId) {
        return res.status(400).json({
          success: false,
          message: "Thiếu teacherId",
        });
      }

      const db = await connectDB();
      const teachers = db.collection("teachers");

      // Normalize majors to array
      let majorsArray: string[] = [];
      if (majors) {
        if (Array.isArray(majors)) {
          majorsArray = majors;
        } else if (typeof majors === "string") {
          majorsArray = majors
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
        }
      }

      // Update teacher with majors
      const result = await teachers.updateOne(
        { teacherId },
        { $set: { majors: majorsArray } },
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giáo viên",
        });
      }

      // Fetch updated teacher and sync to users
      const updatedTeacher = await teachers.findOne({ teacherId });
      if (updatedTeacher) {
        const { syncTeacherToUser } = require("../utils/syncUserData");
        await syncTeacherToUser(updatedTeacher);
        console.log(
          `✅ [update-majors] Updated majors for ${teacherId} and synced to users`,
        );
      }

      return res.json({
        success: true,
        message: "Cập nhật chuyên môn thành công",
        majors: majorsArray,
      });
    } catch (err: any) {
      console.error(
        "❌ POST /admin/teachers/:teacherId/update-majors error:",
        err,
      );
      res.status(500).json({
        success: false,
        message: "Lỗi cập nhật chuyên môn",
        error: err?.message || String(err),
      });
    }
  },
);

// ✅ DEBUG: Get teacher data from teachers collection by teacherId
router.get(
  "/debug/teacher/:teacherId",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { teacherId } = req.params;
      const db = await connectDB();
      const teachers = db.collection("teachers");
      const users = db.collection("users");

      // Get from teachers collection
      const teacher = await teachers.findOne({ teacherId });
      // Get from users collection
      const user = await users.findOne({ teacherId });

      return res.json({
        success: true,
        teacherId,
        teacher: teacher || { message: "Not found in teachers collection" },
        user: user || { message: "Not found in users collection" },
      });
    } catch (err: any) {
      console.error("❌ GET /admin/debug/teacher error:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi debug",
        error: err?.message || String(err),
      });
    }
  },
);

// ✅ SYNC: Push majors from teachers to users collection for all teachers
router.post(
  "/sync/majors-to-users",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const teachers = db.collection("teachers");
      const users = db.collection("users");

      // Get all teachers
      const allTeachers = await teachers.find({}).toArray();

      let syncedCount = 0;
      const logs: string[] = [];

      for (const teacher of allTeachers) {
        if (!teacher.teacherId) continue;

        // Check if teacher has majors
        if (
          !teacher.majors ||
          !Array.isArray(teacher.majors) ||
          teacher.majors.length === 0
        ) {
          continue;
        }

        // Update user with majors
        const result = await users.updateOne(
          { teacherId: teacher.teacherId },
          {
            $set: {
              majors: teacher.majors,
              major: teacher.majors.join(", "),
            },
          },
        );

        if (result.matchedCount > 0 && result.modifiedCount > 0) {
          syncedCount++;
          logs.push(
            `✅ Teacher ${teacher.teacherId} (${teacher.name}) - majors synced: ${teacher.majors.join(", ")}`,
          );
        }
      }

      console.log(`📝 [sync/majors-to-users] Synced ${syncedCount} teachers`);
      logs.forEach((log) => console.log(log));

      return res.json({
        success: true,
        message: `✅ Đẩy chuyên môn thành công: ${syncedCount} giáo viên`,
        syncedCount,
        sampleLogs: logs.slice(0, 10),
      });
    } catch (err: any) {
      console.error("❌ POST /admin/sync/majors-to-users error:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi đẩy chuyên môn",
        error: err?.message || String(err),
      });
    }
  },
);
