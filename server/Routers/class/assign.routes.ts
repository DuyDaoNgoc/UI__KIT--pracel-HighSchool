import { Router } from "express";
import { assignTeacherToClass } from "../../controllers/admin/class/assignTeacherToClass";

const router = Router();

// POST /api/assign
router.post("/", assignTeacherToClass);

export default router;
