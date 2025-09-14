import { Router, Request, Response } from "express";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware";
import { connectDB } from "../configs/db";
import { ObjectId } from "mongodb";
import { createStudent } from "../controllers/createStudent";

const router = Router();

// ===== Interface =====
interface IGradesLock {
  _id: string;
  locked: boolean;
}

// ===== Quản lý học sinh =====
// Tạo học sinh
router.post("/students/create", verifyToken, requireAdmin, createStudent);

// Lấy danh sách học sinh
router.get(
  "/students",
  verifyToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const db = await connectDB();
      const students = await db.collection("students").find().toArray();
      res.json(students);
    } catch (err) {
      console.error("❌ GET /students error:", err);
      res
        .status(500)
        .json({ message: "Lỗi lấy danh sách học sinh", error: err });
    }
  }
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

      if (!id) {
        return res.status(400).json({ message: "❌ Thiếu ID học sinh để xoá" });
      }

      // Hỗ trợ cả _id (ObjectId) lẫn studentId (string)
      let filter;
      if (ObjectId.isValid(id)) {
        filter = { _id: new ObjectId(id) };
      } else {
        filter = { studentId: id };
      }

      const result = await students.deleteOne(filter);
      if (result.deletedCount === 0) {
        return res
          .status(404)
          .json({ message: "❌ Không tìm thấy học sinh để xoá" });
      }

      const allStudents = await students
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      return res.json({
        message: "✅ Xoá học sinh thành công",
        students: allStudents,
      });
    } catch (err) {
      console.error("❌ DELETE /students/:id error:", err);
      res.status(500).json({ message: "Lỗi xoá học sinh", error: err });
    }
  }
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
  }
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
        { upsert: true }
      );
      res.json({ message: "✅ Grades locked", locked: true });
    } catch (err) {
      console.error("❌ POST /grades/lock error:", err);
      res.status(500).json({ message: "Lỗi khóa điểm", error: err });
    }
  }
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
        { upsert: true }
      );
      res.json({ message: "✅ Grades unlocked", locked: false });
    } catch (err) {
      console.error("❌ POST /grades/unlock error:", err);
      res.status(500).json({ message: "Lỗi mở khóa điểm", error: err });
    }
  }
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
  }
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
      res.json({ message: "✅ News approved" });
    } catch (err) {
      console.error("❌ POST /news/:id/approve error:", err);
      res.status(500).json({ message: "Lỗi duyệt tin tức", error: err });
    }
  }
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
      res.json({ message: "✅ News rejected" });
    } catch (err) {
      console.error("❌ POST /news/:id/reject error:", err);
      res.status(500).json({ message: "Lỗi từ chối tin tức", error: err });
    }
  }
);

export default router;
