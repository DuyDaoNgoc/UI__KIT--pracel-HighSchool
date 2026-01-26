import express, { Request, Response } from "express";
import Major from "../../models/Major";
import { verifyToken, checkRole } from "../../middleware/authMiddleware";

const router = express.Router();

// GET /api/majors - list majors
router.get("/", async (req: Request, res: Response) => {
  try {
    const majors = await Major.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: majors });
  } catch (err) {
    console.error("GET /majors error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// POST /api/majors - create major (admin only)
router.post(
  "/",
  verifyToken,
  checkRole(["admin"]),
  async (req: Request, res: Response) => {
    try {
      const { name, code } = req.body;
      if (!name || !code)
        return res
          .status(400)
          .json({ message: "Missing required fields: name, code" });

      const exists = await Major.findOne({ code });
      if (exists)
        return res.status(409).json({ message: "Major code already exists" });

      const m = new Major({ name, code });
      await m.save();
      res.status(201).json({ success: true, data: m });
    } catch (err) {
      console.error("POST /majors error:", err);
      res.status(500).json({ message: "Server error", error: err });
    }
  },
);

export default router;
