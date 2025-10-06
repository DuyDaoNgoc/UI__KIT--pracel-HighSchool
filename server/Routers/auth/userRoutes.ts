import express from "express";
import {
  registerUser,
  loginUser,
  getAllUsers,
  deleteUser,
} from "../../controllers/userController";

const router = express.Router();

// Auth
router.post("/register", registerUser);
router.post("/login", loginUser);

// Users
router.get("/", getAllUsers);
router.delete("/:id", deleteUser);

export default router;
