import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function AuthButtons() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (user) {
    return (
      <div className="creater__user" style={{ position: "relative" }}>
        <span>
          {" "}
          <b>{user.username}</b> ({user.role}){" "}
        </span>
        <div
          className="avatar"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            overflow: "hidden",
            cursor: "pointer",
            border: "2px solid #ccc",
          }}
        >
          <img
            src={user.avatar || "https://via.placeholder.com/40"}
            alt="avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div
            className="dropdown-menu"
            style={{
              position: "absolute",
              top: "50px",
              right: 0,
              background: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              borderRadius: "8px",
              padding: "10px",
              minWidth: "180px",
              zIndex: 999,
            }}
          >
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              <li
                style={{ padding: "8px", cursor: "pointer" }}
                onClick={() => navigate("/profile")}
              >
                Thông tin cá nhân
              </li>
              <li
                style={{ padding: "8px", cursor: "pointer" }}
                onClick={() => navigate("/schedule")}
              >
                Lịch học
              </li>
              <li
                style={{ padding: "8px", cursor: "pointer" }}
                onClick={() => navigate("/tuition")}
              >
                Học phí
              </li>
              <li
                style={{
                  padding: "8px",
                  cursor: "pointer",
                  color: "red",
                  borderTop: "1px solid #eee",
                  marginTop: "5px",
                }}
                onClick={logout}
              >
                Đăng xuất
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  }

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
