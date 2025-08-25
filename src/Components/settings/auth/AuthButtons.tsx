import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { FaBars as HamburgerIcon } from "react-icons/fa"; // dùng icon trong react-icons

export default function AuthButtons() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // menu items (viết cứng ở đây, sau có thể tách ra file config)
  const menuItems = {
    hotels: "Khách sạn",
    airlines: "Hãng bay",
    vacation: "Kỳ nghỉ",
    find_more: "Xem thêm",
  };

  if (user) {
    return (
      <div className="creater__user">
        <span>
          <b>{user.username}</b> ({user.role})
        </span>

        {/* hamburger */}
        <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <HamburgerIcon />
        </div>

        {/* MOBILE MENU */}
        {isMenuOpen && (
          <div className="mobile-menu">
            <ul>
              <li>
                <a href="/">{menuItems.hotels}</a>
              </li>
              <li>
                <a href="/airlines">{menuItems.airlines}</a>
              </li>
              <li>
                <a href="/vacation">{menuItems.vacation}</a>
              </li>
              <li>
                <a href="/find-more">{menuItems.find_more}</a>
              </li>
            </ul>
          </div>
        )}

        <button className="creater__user--btn" onClick={logout}>
          Đăng xuất
        </button>
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
