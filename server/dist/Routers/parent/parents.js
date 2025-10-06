"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ParentController_1 = require("../../controllers/parent/ParentController");
const router = express_1.default.Router();
// GET tất cả phụ huynh
router.get("/", ParentController_1.getAllParents);
// POST tạo phụ huynh mới
router.post("/", ParentController_1.createParent);
exports.default = router;
