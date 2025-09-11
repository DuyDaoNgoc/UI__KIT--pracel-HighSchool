import { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload & {
      id?: string; // ID của user (student, teacher, admin, parent)
      role?: "student" | "teacher" | "admin" | "parent";
      email?: string;

      // Nếu là phụ huynh thì có thêm danh sách con
      children?: {
        id: string; // ID học sinh
        name: string; // Tên học sinh
        class?: string; // Lớp
        schoolYear?: string; // Niên khóa
      }[];
    };
  }
}
