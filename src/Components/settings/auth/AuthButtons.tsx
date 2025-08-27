import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import avatar from "../../../../public/assets/imgs/avatar/avatar.jpg";

interface User {
  username: string;
  role: string;
  avatar?: string;
}

export default function AuthButtons() {
  const navigate = useNavigate();
  const { user, logout } = useAuth() as {
    user: User | null;
    logout: () => void;
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (user) {
    return (
      <div className="creater__user text__content--size-18 ">
        <span className="creater__user--color">
          <b>{user.username}</b> ({user.role})
        </span>
        <div className="avatar" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <img
            src={user.avatar || avatar}
            alt="avatar"
            className="avatar-image"
          />
        </div>

        {isMenuOpen && (
          <div className="dropdown-menu">
            <ul className="dropdown-menu--list">
              <li
                className="dropdown-menu--list-item"
                onClick={() => navigate("/profile")}
              >
                Thông tin cá nhân
              </li>
              <li
                className="dropdown-menu--list-item"
                onClick={() => navigate("/schedule")}
              >
                Lịch học
              </li>
              <li
                className="dropdown-menu--list-item"
                onClick={() => navigate("/tuition")}
              >
                Học phí
              </li>
              <li className="dropdown-menu--list-logout" onClick={logout}>
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
        className="creater__user--btn  text__content--size-18 "
        onClick={() => navigate("/login")}
      >
        Đăng nhập
      </button>
      <button
        className="creater__user--btn  text__content--size-18"
        onClick={() => navigate("/register")}
      >
        Đăng ký
      </button>
    </div>
  );
}
