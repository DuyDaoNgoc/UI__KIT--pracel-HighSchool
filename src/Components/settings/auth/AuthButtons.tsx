import React from "react";
import { useNavigate } from "react-router-dom";

export default function AuthButtons() {
  const navigate = useNavigate();

  return (
    <div className="creater__user">
      <button
        className="creater__user--btn"
        onClick={() => navigate("/register")}
      >
        Đăng ký
      </button>
      <button className="creater__user--btn" onClick={() => navigate("/login")}>
        Đăng nhập
      </button>
    </div>
  );
}
