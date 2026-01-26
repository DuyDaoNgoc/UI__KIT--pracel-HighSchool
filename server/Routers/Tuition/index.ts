import express, { Request, Response } from "express";
import Tuition, { ITuition } from "../../models/Tuition";
import Subject from "../../models/Subject";
import Major from "../../models/Major";
import { verifyToken, checkRole } from "../../middleware/authMiddleware";
import ClassModel from "../../models/Class";
import User from "../../models/User";
import { getIo } from "../../utils/socketio";

const router = express.Router();

/**
 * GET /api/tuitions
 * Lấy tất cả bảng học phí
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const tuitions = await Tuition.find()
      .populate("classId")
      .populate("subjects.subjectId")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tuitions });
  } catch (err) {
    console.error("❌ GET /tuitions error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

/**
 * GET /api/tuitions/:id
 * Lấy chi tiết một bảng học phí
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tuition = await Tuition.findById(id)
      .populate("classId")
      .populate("subjects.subjectId");

    if (!tuition) {
      return res.status(404).json({ message: "Tuition not found" });
    }

    res.status(200).json({ success: true, data: tuition });
  } catch (err) {
    console.error("❌ GET /tuitions/:id error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

/**
 * GET /api/tuitions/class/:classId?semester=1
 * Lấy bảng học phí theo lớp và kì học
 */
router.get("/class/:classId", async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { semester } = req.query;

    const filter: any = { classId };
    if (semester) {
      filter.semester = parseInt(semester as string);
    }

    const tuitions = await Tuition.find(filter)
      .populate("classId")
      .populate("subjects.subjectId");

    res.status(200).json({ success: true, data: tuitions });
  } catch (err) {
    console.error("❌ GET /tuitions/class/:classId error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

/**
 * POST /api/tuitions
 * Tạo bảng học phí mới (Admin only)
 * Body: { classId, schoolYear, semester, subjectIds: [...] }
 */
router.post(
  "/",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { classId, schoolYear, semester, subjectIds, description } =
        req.body;

      console.log(
        "📝 Creating tuition for class:",
        classId,
        "schoolYear:",
        schoolYear,
        "semester:",
        semester,
      );

      // Validate input
      if (!classId || !semester || !Array.isArray(subjectIds)) {
        return res.status(400).json({
          message: "Missing required fields: classId, semester, subjectIds",
        });
      }

      // Kiểm tra class tồn tại
      const classData = await ClassModel.findById(classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Lấy thông tin các môn học và tính tổng học phí
      const subjects = await Subject.find({ _id: { $in: subjectIds } });
      if (subjects.length !== subjectIds.length) {
        return res.status(404).json({ message: "Some subjects not found" });
      }

      const tuitionSubjects = subjectIds.map((subjectId: string) => {
        const subject = (subjects as any[]).find(
          (s) => s._id.toString() === subjectId,
        );
        return {
          subjectId,
          price: subject?.price || 0,
        };
      });

      const totalAmount = tuitionSubjects.reduce(
        (sum: number, item: any) => sum + item.price,
        0,
      );

      // Kiểm tra xem đã có bảng học phí cho class + schoolYear + semester này chưa
      const existing = await Tuition.findOne({ classId, schoolYear, semester });
      if (existing) {
        console.log(
          "⚠️ Tuition already exists for this class + schoolYear + semester",
        );
        return res.status(409).json({
          message: "Tuition for this class, year and semester already exists",
        });
      }

      // Tạo bảng học phí
      const tuition = new Tuition({
        classId,
        schoolYear: schoolYear || classData.schoolYear,
        semester,
        subjects: tuitionSubjects,
        totalAmount,
        description,
        isActive: true,
      });

      await tuition.save();
      await tuition.populate("classId");
      await tuition.populate("subjects.subjectId");

      console.log("✅ Tuition created:", tuition._id);

      // ============ AUTO-CREATE StudentTuition RECORDS ============
      try {
        console.log(
          "📚 Creating StudentTuition records for all students in class:",
          classId,
        );
        console.log("📍 Class data:", {
          _id: classData._id,
          name: classData.name,
          classCode: classData.classCode,
          schoolYear: classData.schoolYear,
        });

        const StudentTuitionModel = require("../../models/StudentTuition");
        const StudentModel = require("../../models/Student");

        // Get all students in this class
        console.log(
          "🔍 Searching for students with classCode:",
          classData.classCode,
        );
        const students = await StudentModel.find({
          classCode: classData.classCode,
        }).catch((err: any) => {
          console.error("❌ Error finding students:", err.message);
          throw err;
        });
        console.log(
          `📊 Found ${students.length} students in class ${classData.classCode}`,
        );

        if (students.length > 0) {
          console.log(
            "👥 Student details:",
            students.map((s) => ({
              _id: s._id,
              name: s.name,
              studentId: s.studentId,
              classCode: s.classCode,
            })),
          );

          // Create StudentTuition record for each student
          const studentTuitionRecords = students.map((student: any) => ({
            tuitionId: tuition._id,
            studentId: student._id,
            schoolYear: schoolYear || classData.schoolYear,
            semester,
            totalAmount,
            paidAmount: 0,
            remainingAmount: totalAmount,
            status: "unpaid" as const,
          }));

          console.log(
            "📝 Creating StudentTuition records:",
            studentTuitionRecords.length,
          );

          try {
            console.log("🔄 StudentTuitionRecords details:", {
              count: studentTuitionRecords.length,
              firstRecord: studentTuitionRecords[0],
            });

            const createdRecords = await StudentTuitionModel.insertMany(
              studentTuitionRecords,
            ).catch((insertErr: any) => {
              console.error("❌ insertMany error details:", {
                message: insertErr.message,
                code: insertErr.code,
                errors: insertErr.errors,
                stack: insertErr.stack,
              });
              throw insertErr;
            });
            console.log(
              `✅ Created ${createdRecords.length} StudentTuition records`,
            );
            console.log(
              "📋 First created record:",
              JSON.stringify(createdRecords[0], null, 2),
            );

            // Verify the records were created correctly
            const verifyRecords = await StudentTuitionModel.find({
              tuitionId: tuition._id,
            });
            console.log(
              `✅ Verification: ${verifyRecords.length} records now in DB`,
            );
            if (verifyRecords.length > 0) {
              console.log(
                "📋 First verified record:",
                JSON.stringify(verifyRecords[0], null, 2),
              );
            }

            // Emit socket event for real-time update
            const io = getIo();
            if (io) {
              console.log("📤 Emitting student-tuition:created event");
              io.emit("student-tuition:created", {
                tuitionId: tuition._id,
                recordsCreated: createdRecords.length,
                message: `Created ${createdRecords.length} student tuition records`,
              });
            }
          } catch (insertErr: any) {
            console.error("❌ Error creating StudentTuition records:", {
              message: insertErr.message,
              code: insertErr.code,
              errors: insertErr.errors,
              stack: insertErr.stack,
            });
            // Don't fail the entire tuition creation, just log the error
            console.warn(
              "⚠️ Tuition created but StudentTuition records failed",
            );
          }
        } else {
          console.warn(
            `⚠️ No students found for classCode: ${classData.classCode}`,
          );
          const allStudents = await StudentModel.find().select(
            "classCode name studentId",
          );
          console.log(
            "💡 Available students in DB:",
            allStudents.slice(0, 5).map((s) => ({
              classCode: s.classCode,
              name: s.name,
              studentId: s.studentId,
            })),
          );
        }
      } catch (studentFetchErr: any) {
        console.error("❌ Error in StudentTuition auto-generation:", {
          message: studentFetchErr.message,
          stack: studentFetchErr.stack,
          code: studentFetchErr.code,
        });
        console.warn(
          "⚠️ Tuition created but StudentTuition auto-generation failed",
        );
      }

      res.status(201).json({
        success: true,
        message: "Tuition created successfully",
        data: tuition,
      });
    } catch (err: any) {
      console.error("❌ POST /tuitions error:", {
        message: err.message,
        stack: err.stack,
        code: err.code,
        details: err.toString(),
      });
      res.status(500).json({
        message: "Server error",
        error: err.message,
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  },
);

/**
 * PUT /api/tuitions/:id
 * Cập nhật bảng học phí (Admin only)
 */
router.put(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { subjectIds, description, isActive } = req.body;

      console.log("📝 Updating tuition:", id);

      const tuition = await Tuition.findById(id);
      if (!tuition) {
        return res.status(404).json({ message: "Tuition not found" });
      }

      // Cập nhật môn học nếu có
      if (subjectIds) {
        const subjects = await Subject.find({ _id: { $in: subjectIds } });
        if (subjects.length !== subjectIds.length) {
          return res.status(404).json({ message: "Some subjects not found" });
        }

        tuition.subjects = subjectIds.map((subjectId: string) => {
          const subject = (subjects as any[]).find(
            (s) => s._id.toString() === subjectId,
          );
          return {
            subjectId: subject?._id || subjectId,
            price: subject?.price || 0,
          };
        });

        tuition.totalAmount = tuition.subjects.reduce(
          (sum: number, item: any) => sum + item.price,
          0,
        );
      }

      if (description !== undefined) tuition.description = description;
      if (isActive !== undefined) tuition.isActive = isActive;

      await tuition.save();
      await tuition.populate("classId");
      await tuition.populate("subjects.subjectId");

      console.log("✅ Tuition updated:", id);
      res.status(200).json({
        success: true,
        message: "Tuition updated successfully",
        data: tuition,
      });
    } catch (err) {
      console.error("❌ PUT /tuitions/:id error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

/**
 * DELETE /api/tuitions/:id
 * Xóa bảng học phí (Admin only) + xóa tất cả StudentTuition liên quan
 */
router.delete(
  "/:id",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      console.log("🗑️ Deleting tuition:", id);

      // Validate id format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        console.error("❌ Invalid tuition ID format:", id);
        return res.status(400).json({ message: "Invalid tuition ID" });
      }

      // First, get all StudentTuition records linked to this tuition
      let StudentTuition;
      try {
        StudentTuition =
          require("../../models/StudentTuition").default ||
          require("../../models/StudentTuition");
      } catch (err) {
        console.error("❌ Failed to load StudentTuition model:", err);
        throw err;
      }

      // Get linked records (without populate to avoid null issues)
      let linkedRecords = [];
      try {
        linkedRecords = await StudentTuition.find({ tuitionId: id }).lean();
        console.log(
          `📋 Found ${linkedRecords.length} StudentTuition records to delete`,
        );
      } catch (err) {
        console.error("❌ Error finding StudentTuition records:", err);
        throw err;
      }

      // Delete all StudentTuition records
      let deleteResult;
      try {
        deleteResult = await StudentTuition.deleteMany({ tuitionId: id });
        console.log(
          `✅ Deleted ${deleteResult.deletedCount} StudentTuition records`,
        );
      } catch (err) {
        console.error("❌ Error deleting StudentTuition records:", err);
        throw err;
      }

      // Delete the tuition itself
      let tuition;
      try {
        tuition = await Tuition.findByIdAndDelete(id);
        if (!tuition) {
          return res.status(404).json({ message: "Tuition not found" });
        }
        console.log("✅ Tuition deleted:", id);
      } catch (err) {
        console.error("❌ Error deleting Tuition:", err);
        throw err;
      }

      // Emit socket event to notify all clients
      const io = getIo();
      if (io) {
        console.log(
          "📤 Emitting student-tuition:deleted event for tuition:",
          id,
          "to all connected clients",
        );
        console.log(
          "🔌 Active socket connections:",
          (io as any).engine.clientsCount || "unknown",
        );
        io.emit("student-tuition:deleted", {
          tuitionId: id,
          deletedCount: deleteResult.deletedCount,
          message: `Tuition ${id} and ${deleteResult.deletedCount} student records deleted`,
        });
        console.log("✅ Event emitted successfully");
      } else {
        console.error("❌ IO instance is null - cannot emit event");
      }

      res.status(200).json({
        success: true,
        message: "Tuition deleted",
        deletedStudentTuitions: deleteResult.deletedCount,
      });
    } catch (err) {
      console.error("❌ DELETE /tuitions/:id error:", err);
      const errorMsg = err instanceof Error ? err.message : "Server error";
      res.status(500).json({
        message: "Server error",
        error: errorMsg,
        details: process.env.NODE_ENV === "development" ? err : undefined,
      });
    }
  },
);

/**
 * GET /api/tuitions/:tuitionId/students
 * Get all students with this tuition and their payment status
 */
router.get(
  "/:tuitionId/students",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { tuitionId } = req.params;
      console.log(
        "🔍 [Tuition.students] Fetching students for tuitionId:",
        tuitionId,
      );

      const StudentTuition =
        require("../../models/StudentTuition").default ||
        require("../../models/StudentTuition");

      const studentTuitions = await StudentTuition.find({
        tuitionId,
      })
        .populate("studentId", "name studentId email phone")
        .sort({ createdAt: -1 });

      console.log(
        `📊 [Tuition.students] Found ${studentTuitions.length} records for tuitionId: ${tuitionId}`,
      );

      if (studentTuitions.length > 0) {
        console.log(
          "📋 [Tuition.students] First record:",
          JSON.stringify(studentTuitions[0], null, 2),
        );
      }

      if (!studentTuitions || studentTuitions.length === 0) {
        console.warn(
          `⚠️ [Tuition.students] No StudentTuition records found for tuitionId: ${tuitionId}`,
        );
        return res.status(200).json({
          success: true,
          message: "No students assigned to this tuition yet",
          data: [],
        });
      }

      res.status(200).json({
        success: true,
        data: studentTuitions,
      });
    } catch (err) {
      console.error("❌ GET /tuitions/:tuitionId/students error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

/**
 * POST /api/tuitions/:tuitionId/generate-for-students
 * Generate tuition records for all students matching this tuition plan
 * Admin only
 */
router.post(
  "/:tuitionId/generate-for-students",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { tuitionId } = req.params;

      console.log(
        "📝 [Tuition] Generating student tuitions for tuition plan:",
        tuitionId,
      );

      // Find the tuition plan
      const tuition = await Tuition.findById(tuitionId).populate("classId");
      if (!tuition) {
        console.log("❌ [Tuition] Tuition not found:", tuitionId);
        return res
          .status(404)
          .json({ success: false, message: "Tuition not found" });
      }

      console.log("✅ [Tuition] Found tuition:", {
        id: tuition._id,
        classId: tuition.classId._id,
        totalAmount: tuition.totalAmount,
      });

      // Find all students in the class
      const classData = await ClassModel.findById(tuition.classId._id).lean();
      if (!classData) {
        console.log("❌ [Tuition] Class not found:", tuition.classId._id);
        return res
          .status(404)
          .json({ success: false, message: "Class not found" });
      }

      console.log("✅ [Tuition] Found class:", {
        id: classData._id,
        code: classData.classCode,
        studentCount: classData.studentIds?.length || 0,
      });

      // DEBUG: Check what's actually in studentIds
      console.log(
        "🔍 [Tuition] DEBUG - classData.studentIds:",
        classData.studentIds,
      );
      console.log(
        "🔍 [Tuition] DEBUG - studentIds is Array?:",
        Array.isArray(classData.studentIds),
      );
      console.log(
        "🔍 [Tuition] DEBUG - studentIds length:",
        classData.studentIds?.length,
      );
      console.log(
        "🔍 [Tuition] DEBUG - First 3 studentIds:",
        classData.studentIds?.slice(0, 3),
      );

      // Convert ObjectIds to strings (already plain objects from .lean())
      const studentIds = (classData.studentIds || []).map((id: any) =>
        typeof id === "string" ? id : String(id),
      );

      console.log("📋 [Tuition] Student IDs to process:", studentIds.length);
      console.log("📋 [Tuition] StudentIds raw:", studentIds);
      console.log(
        "📋 [Tuition] StudentIds types:",
        studentIds.map((id: any) => ({
          id,
          type: typeof id,
          idType: id?.constructor?.name,
        })),
      );

      if (studentIds.length === 0) {
        console.log("⚠️ [Tuition] No students found in this class");
        return res.status(200).json({
          success: true,
          message: "No students found in this class",
          generatedCount: 0,
        });
      }

      // Create StudentTuition records for each student
      const StudentTuition =
        require("../../models/StudentTuition").default ||
        require("../../models/StudentTuition");

      let createdCount = 0;
      let skippedCount = 0;

      for (const studentId of studentIds) {
        try {
          console.log(
            `📝 [Tuition] Processing studentId: ${studentId} (Type: ${typeof studentId}, Constructor: ${studentId.constructor.name})`,
          );

          // Check if already exists
          const existing = await StudentTuition.findOne({
            tuitionId,
            studentId: studentId,
          });

          if (existing) {
            console.log(
              "⏭️ [Tuition] Record already exists for student:",
              studentId,
            );
            skippedCount++;
            continue;
          }

          // Create new StudentTuition record
          const newRecord = await StudentTuition.create({
            tuitionId,
            studentId: studentId,
            schoolYear: tuition.schoolYear,
            semester: tuition.semester,
            totalAmount: tuition.totalAmount,
            paidAmount: 0,
            remainingAmount: tuition.totalAmount,
            status: "unpaid",
            notes: `Generated for class ${classData.classCode}`,
          });

          console.log("✅ [Tuition] Created StudentTuition record:", {
            _id: newRecord._id,
            storedStudentId: newRecord.studentId,
            storedStudentIdType: typeof newRecord.studentId,
            storedStudentIdString: String(newRecord.studentId),
            tuitionId: newRecord.tuitionId,
            schoolYear: newRecord.schoolYear,
            semester: newRecord.semester,
          });

          createdCount++;
        } catch (e: any) {
          if (e.code !== 11000) {
            // Ignore duplicate key error
            console.warn(
              `⚠️ [Tuition] Failed to create tuition for student ${studentId}:`,
              e.message,
            );
          }
        }
      }

      console.log(
        `✅ [Tuition] Generated ${createdCount} new student tuition records, skipped ${skippedCount} duplicates`,
      );

      // Emit socket events for each created tuition record
      try {
        const io = getIo();
        if (io && createdCount > 0) {
          console.log(
            `📡 [Tuition] Emitting ${createdCount} student-tuition:created events`,
          );
          // Emit a bulk update event
          io.emit("student-tuition:created", {
            tuitionId,
            classCode: classData.classCode,
            createdCount,
            message: `${createdCount} new student tuition records created`,
          });
        }
      } catch (socketErr) {
        console.error("⚠️ Socket emit error (non-blocking):", socketErr);
      }

      res.status(200).json({
        success: true,
        message: `Generated tuition records for ${createdCount} students`,
        generatedCount: createdCount,
        skippedCount: skippedCount,
        totalStudents: studentIds.length,
      });
    } catch (err) {
      console.error(
        "❌ [Tuition] POST /tuitions/:tuitionId/generate-for-students error:",
        err,
      );
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err });
    }
  },
);

/**
 * POST /api/tuitions/:classId/sync-students
 * Sync students from Student collection into Class.studentIds
 * This fixes the issue where Class.studentIds is empty
 */
router.post(
  "/:classId/sync-students",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;

      console.log("🔄 [Tuition] Syncing students into class:", classId);

      const classData = await ClassModel.findById(classId);
      if (!classData) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found" });
      }

      // Find all students with matching classCode and schoolYear
      const students = await User.find({
        classCode: classData.classCode,
        schoolYear: classData.schoolYear,
        role: "student",
      }).select("_id");

      console.log(
        "📚 [Tuition] Found",
        students.length,
        "students for class:",
        {
          classCode: classData.classCode,
          schoolYear: classData.schoolYear,
        },
      );

      if (students.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No students found to sync",
          syncedCount: 0,
        });
      }

      // Update class with student IDs
      const studentIds = students.map((s) => s._id);
      classData.studentIds = studentIds;
      await classData.save();

      console.log(
        "✅ [Tuition] Updated class with",
        studentIds.length,
        "students",
      );

      res.status(200).json({
        success: true,
        message: `Synced ${studentIds.length} students into class`,
        syncedCount: studentIds.length,
        classId: classData._id,
      });
    } catch (err) {
      console.error("❌ [Tuition] Sync students error:", err);
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err });
    }
  },
);

/**
 * POST /api/tuitions/:tuitionId/regenerate-for-students
 * Force regenerate tuition records (delete old + create new)
 * Admin only - Use this if generate-for-students shows 0
 */
router.post(
  "/:tuitionId/regenerate-for-students",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { tuitionId } = req.params;

      console.log(
        "🔄 [Tuition] REGENERATE - Force regenerating student tuitions for tuition plan:",
        tuitionId,
      );

      // Find the tuition plan
      const tuition = await Tuition.findById(tuitionId).populate("classId");
      if (!tuition) {
        console.log("❌ [Tuition] Tuition not found:", tuitionId);
        return res
          .status(404)
          .json({ success: false, message: "Tuition not found" });
      }

      // Find all students in the class
      const classData = await ClassModel.findById(tuition.classId._id).lean();
      if (!classData) {
        console.log("❌ [Tuition] Class not found:", tuition.classId._id);
        return res
          .status(404)
          .json({ success: false, message: "Class not found" });
      }

      console.log("✅ [Tuition] Found class:", {
        id: classData._id,
        code: classData.classCode,
        studentCount: classData.studentIds?.length || 0,
      });

      // Convert ObjectIds to strings
      const studentIds = (classData.studentIds || []).map((id: any) =>
        typeof id === "string" ? id : String(id),
      );

      console.log(
        "📋 [Tuition] REGENERATE - Students to process:",
        studentIds.length,
      );
      console.log("📋 [Tuition] REGENERATE - Student IDs:", studentIds);

      if (studentIds.length === 0) {
        console.log(
          "⚠️ [Tuition] REGENERATE - No students found in this class",
        );
        return res.status(200).json({
          success: true,
          message: "No students found in this class",
          deletedCount: 0,
          generatedCount: 0,
        });
      }

      const StudentTuition =
        require("../../models/StudentTuition").default ||
        require("../../models/StudentTuition");

      // DELETE all existing records for this tuition
      const deleteResult = await StudentTuition.deleteMany({ tuitionId });
      console.log(
        "🗑️ [Tuition] REGENERATE - Deleted",
        deleteResult.deletedCount,
        "existing records",
      );

      // CREATE new records for each student
      let createdCount = 0;
      let failedCount = 0;

      for (const studentId of studentIds) {
        try {
          console.log(
            `📝 [Tuition] REGENERATE - Creating for studentId: ${studentId} (Type: ${typeof studentId})`,
          );

          const newRecord = await StudentTuition.create({
            tuitionId,
            studentId: studentId,
            schoolYear: tuition.schoolYear,
            semester: tuition.semester,
            totalAmount: tuition.totalAmount,
            paidAmount: 0,
            remainingAmount: tuition.totalAmount,
            status: "unpaid",
            notes: `Regenerated for class ${classData.classCode}`,
          });

          console.log("✅ [Tuition] REGENERATE - Created record for:", {
            studentId,
            recordId: newRecord._id,
            storedStudentId: newRecord.studentId,
          });

          createdCount++;
        } catch (e: any) {
          failedCount++;
          console.error(
            `❌ [Tuition] REGENERATE - Failed to create for student ${studentId}:`,
            e.message,
          );
        }
      }

      console.log(
        `✅ [Tuition] REGENERATE - Complete: ${createdCount} created, ${failedCount} failed`,
      );

      // Emit socket events for regenerated tuition records
      try {
        const io = getIo();
        if (io && createdCount > 0) {
          console.log(
            `📡 [Tuition] Emitting student-tuition:created events (regenerate)`,
          );
          io.emit("student-tuition:created", {
            tuitionId,
            classCode: classData.classCode,
            createdCount,
            regenerated: true,
            message: `${createdCount} regenerated student tuition records`,
          });
        }
      } catch (socketErr) {
        console.error("⚠️ Socket emit error (non-blocking):", socketErr);
      }

      res.status(200).json({
        success: true,
        message: `Regenerated ${createdCount} student tuition records`,
        deletedCount: deleteResult.deletedCount,
        generatedCount: createdCount,
        failedCount: failedCount,
        totalStudents: studentIds.length,
      });
    } catch (err) {
      console.error("❌ [Tuition] REGENERATE error:", err);
      res
        .status(500)
        .json({ success: false, message: "Server error", error: err });
    }
  },
);

/**
 * PUT /api/student-tuitions/:studentTuitionId
 * Update student tuition payment status (Admin only)
 * Body: { paidAmount, notes }
 */
router.put(
  "/student-tuition/:studentTuitionId",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { studentTuitionId } = req.params;
      const { paidAmount, notes } = req.body;
      const adminId = (req as any).userId;

      const StudentTuition =
        require("../../models/StudentTuition").default ||
        require("../../models/StudentTuition");

      const studentTuition = await StudentTuition.findById(studentTuitionId);
      if (!studentTuition) {
        return res.status(404).json({ message: "Student tuition not found" });
      }

      // Update paid amount
      if (paidAmount !== undefined && paidAmount >= 0) {
        studentTuition.paidAmount = Math.min(
          paidAmount,
          studentTuition.totalAmount,
        );
        studentTuition.remainingAmount =
          studentTuition.totalAmount - studentTuition.paidAmount;

        // Update status
        if (studentTuition.paidAmount === 0) {
          studentTuition.status = "unpaid";
        } else if (studentTuition.paidAmount >= studentTuition.totalAmount) {
          studentTuition.status = "paid";
        } else {
          studentTuition.status = "partial";
        }
      }

      // Update notes
      if (notes !== undefined) {
        studentTuition.notes = notes;
      }

      studentTuition.lastUpdatedBy = adminId;
      await studentTuition.save();

      await studentTuition.populate("studentId", "name studentId");

      console.log(
        `✅ Updated student tuition ${studentTuitionId}: paid=${studentTuition.paidAmount}, remaining=${studentTuition.remainingAmount}`,
      );

      res.status(200).json({
        success: true,
        message: "Student tuition updated successfully",
        data: studentTuition,
      });
    } catch (err) {
      console.error("❌ PUT /student-tuition/:studentTuitionId error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

/**
 * GET /api/tuitions/debug/diagnose-data
 * DIAGNOSTIC ENDPOINT - Check database state (Admin only)
 */
router.get(
  "/debug/diagnose-data",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      console.log("🔍 [DEBUG] Starting diagnostic check...");

      const ClassModel = require("../../models/Class");
      const StudentModel = require("../../models/Student");
      const StudentTuitionModel = require("../../models/StudentTuition");

      // Check classes
      const classCount = await ClassModel.countDocuments();
      const classes = await ClassModel.find()
        .select("_id name classCode")
        .limit(5);
      console.log(`📚 Classes: ${classCount} total, First 5:`, classes);

      // Check students
      const studentCount = await StudentModel.countDocuments();
      const students = await StudentModel.find()
        .select("_id name studentId classCode className")
        .limit(10);
      console.log(`👥 Students: ${studentCount} total, First 10:`, students);

      // Check StudentTuition with null studentId
      const stWithNull = await StudentTuitionModel.find({
        studentId: null,
      }).limit(5);
      console.log(
        `⚠️ StudentTuition with null studentId: ${stWithNull.length}`,
        stWithNull,
      );

      // Check StudentTuition with valid studentId
      const stWithValid = await StudentTuitionModel.find({
        studentId: { $ne: null },
      }).limit(5);
      console.log(
        `✅ StudentTuition with valid studentId: ${stWithValid.length}`,
        stWithValid,
      );

      // Check for class code mismatches
      const groupedByClassCode = {};
      for (const student of students) {
        const cc = student.classCode || "NONE";
        if (!groupedByClassCode[cc]) {
          groupedByClassCode[cc] = 0;
        }
        groupedByClassCode[cc]++;
      }
      console.log("📊 Students grouped by classCode:", groupedByClassCode);

      res.status(200).json({
        success: true,
        diagnostic: {
          classCount,
          studentCount,
          studentTuitionNullCount: stWithNull.length,
          studentTuitionValidCount: stWithValid.length,
          classes: classes,
          sampleStudents: students,
          studentsByClassCode: groupedByClassCode,
          sampleNullRecords: stWithNull,
          sampleValidRecords: stWithValid,
        },
      });
    } catch (err) {
      console.error("❌ DEBUG diagnose-data error:", err);
      const errorMsg = err instanceof Error ? err.message : "Server error";
      res.status(500).json({
        message: "Diagnostic error",
        error: errorMsg,
      });
    }
  },
);

export default router;
