"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assignTeacherToClass_1 = require("../../controllers/admin/class/assignTeacherToClass");
const router = (0, express_1.Router)();
// POST /api/assign
router.post("/", assignTeacherToClass_1.assignTeacherToClass);
exports.default = router;
