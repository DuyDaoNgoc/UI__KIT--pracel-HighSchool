// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "../types/auth";
import { motion } from "framer-motion";

import { pageVariants } from "../configs/animations/pageVariants";

// Định nghĩa kiểu cho context Auth (như user, token, login, logout)
type AuthContextValue = {
  // user có thể là null nếu chưa đăng nhập hoặc kiểu User nếu đã đăng nhập (tham khảo types/auth.ts)
  user: User | null;
  // token có thể là null nếu chưa đăng nhập hoặc chuỗi token nếu đã đăng nhập (thường là JWT)
  token: string | null;
  // hàm để đăng nhập, nhận vào user và token để lưu vào context và localStorage
  login: (user: User, token: string) => void;
  // hàm để đăng xuất, xóa user và token khỏi context và localStorage
  logout: () => void;
};

// Tạo context với giá trị mặc định là null cho user và token, và các hàm login/logout rỗng
const AuthContext = createContext<AuthContextValue>({
  // giá trị mặc định cho user và token là null (như khi chưa đăng nhập)
  user: null,
  token: null,
  // hàm login/logout mặc định không làm gì (như placeholder)
  login: () => {},
  logout: () => {},
});

// Tạo provider để bọc quanh ứng dụng, cung cấp AuthContext cho các component con
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  // nhận prop children để bọc các component con bên trong provider
  children,
}) => {
  // trạng thái user và token, khởi tạo là null (chưa đăng nhập)
  const [user, setUser] = useState<User | null>(null);
  // trạng thái token, khởi tạo là null (chưa đăng nhập)
  const [token, setToken] = useState<string | null>(null);

  // Khi component được mount, kiểm tra localStorage để xem có user/token đã lưu không
  useEffect(() => {
    // lấy user và token từ localStorage (nếu có)
    const rawUser = localStorage.getItem("user");
    // lấy token từ localStorage (nếu có)
    const rawToken = localStorage.getItem("token");
    // nếu có user và token trong localStorage, cập nhật state tương ứng
    if (rawUser && rawToken) {
      // parse JSON an toàn với try/catch để tránh lỗi nếu dữ liệu bị hỏng
      try {
        // chuyển chuỗi JSON thành object User và lưu vào state
        const parsed: User = JSON.parse(rawUser);
        // cập nhật state user và token
        setUser(parsed);
        setToken(rawToken);
      } catch {
        // corrupted -> clear
        // nếu dữ liệu bị hỏng, xóa khỏi localStorage để tránh lỗi sau này khi dùng lại dữ liệu bị hỏng này (như khi JSON.parse lỗi)
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  // hàm để đăng nhập, nhận vào user và token
  const login = (u: User, t: string) => {
    // cập nhật state user và token
    setUser(u);
    setToken(t);
    // lưu user và token vào localStorage để giữ trạng thái đăng nhập khi reload trang
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("token", t);
  };

  // hàm để đăng xuất, xóa user và token khỏi state và localStorage
  const logout = () => {
    // xóa user và token khỏi state
    setUser(null);
    setToken(null);
    // xóa user và token khỏi localStorage để đăng xuất hoàn toàn
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Lưu ý:
  // - Ở đây mình sử dụng pageVariants.zoom để animation (zoom nhẹ + fade) thay vì slide có x translations.
  // - Nếu bạn muốn hoàn toàn KHÔNG animate provider (an toàn nhất), đổi phần return để loại bỏ motion.div.
  // - Hiện tại để phù hợp yêu cầu "nhúng pageVariants", mình dùng zoom (không có x/y) để giảm khả năng đẩy layout.

  return (
    <motion.div
      variants={pageVariants.zoom}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ minHeight: "100%", height: "100%" }}
    >
      <AuthContext.Provider value={{ user, token, login, logout }}>
        {children}
      </AuthContext.Provider>
    </motion.div>
  );
};

export const useAuth = () => useContext(AuthContext);
