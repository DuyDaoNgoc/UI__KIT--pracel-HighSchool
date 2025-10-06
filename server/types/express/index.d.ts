// server/types/express/index.d.ts
import "multer";

declare global {
  namespace Express {
    // ✅ Mở rộng type Multer.File từ namespace gốc Express.Multer
    interface MulterFile extends Express.Multer.File {
      path: string; // thêm field path nếu bạn dùng diskStorage
    }

    // ✅ Mở rộng lại Request (không ghi đè field gốc)
    interface Request {
      user?: {
        id: string;
        role: "admin" | "teacher" | "student" | "parent";
        email: string;
      };
      file?: MulterFile;
    }
  }
}

export {};
