import express from "express";
import {
  getAllParents,
  createParent,
} from "../../controllers/parent/ParentController";

const router = express.Router();

// GET tất cả phụ huynh
router.get("/", getAllParents);

// POST tạo phụ huynh mới
router.post("/", createParent);

export default router;
