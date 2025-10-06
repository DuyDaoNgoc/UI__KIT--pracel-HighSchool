import { Request, Response } from "express";
import Parent, { IParent } from "../../models/Parent";

// GET tất cả phụ huynh
export const getAllParents = async (req: Request, res: Response) => {
  try {
    const parents: IParent[] = await Parent.find().populate("childrenIds");
    res.status(200).json(parents);
  } catch (err) {
    console.error("❌ Lỗi getAllParents:", err);
    res.status(500).json({ message: "Lỗi server khi lấy phụ huynh" });
  }
};

// POST tạo phụ huynh mới
export const createParent = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, childrenIds } = req.body;
    const newParent = new Parent({ name, email, phone, childrenIds });
    await newParent.save();
    res.status(201).json(newParent);
  } catch (err) {
    console.error("❌ Lỗi createParent:", err);
    res.status(500).json({ message: "Lỗi server khi tạo phụ huynh" });
  }
};
