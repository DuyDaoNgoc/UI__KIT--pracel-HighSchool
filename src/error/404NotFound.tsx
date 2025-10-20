// src/pages/NotFound.tsx
import React from "react";
import { Link } from "react-router-dom";

const NotFound: React.FC = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>404</h1>
      <h2>Oops! Trang bạn tìm không tồn tại hoặc không có quyền truy cập.</h2>
      <Link to="/">Quay về trang chủ</Link>
    </div>
  );
};

export default NotFound;
