// src/components/AuthButtons.tsx

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

  // ✅ chọn đường dẫn profile theo role (theo đúng path bạn đưa)
  const handleProfileClick = () => {
    switch (user?.role) {
      case "student":
        navigate("/profile"); // Profile.tsx
        break;
      case "parent":
        navigate("/profile/parent"); // ParentProfile.tsx
        break;
      case "teacher":
        navigate("/profile/teacher"); // TeacherProfile.tsx
        break;
      case "admin":
        navigate("/profile/admin"); // admin/AdminProfile.tsx
        break;
      default:
        navigate("/profile");
    }
  };

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
                onClick={handleProfileClick}
              >
                Thông tin cá nhân
              </li>

              {/* ✅ menu riêng cho học sinh */}
              {user.role === "student" && (
                <>
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
                </>
              )}

              {/* ✅ menu riêng cho phụ huynh */}
              {user.role === "parent" && (
                <>
                  <li
                    className="dropdown-menu--list-item"
                    onClick={() => navigate("/children")}
                  >
                    Quản lý con cái
                  </li>
                  <li
                    className="dropdown-menu--list-item"
                    onClick={() => navigate("/report")}
                  >
                    Báo cáo học tập
                  </li>
                </>
              )}

              {/* ✅ menu riêng cho giáo viên */}
              {user.role === "teacher" && (
                <>
                  <li
                    className="dropdown-menu--list-item"
                    onClick={() => navigate("/profile/teacher/class")}
                  >
                    Quản lý lớp
                  </li>
                  <li
                    className="dropdown-menu--list-item"
                    onClick={() => navigate("/profile/teacher/news")}
                  >
                    Gửi tin tức cho admin duyệt
                  </li>
                  <li
                    className="dropdown-menu--list-item"
                    onClick={() => navigate("/profile/teacher/scores")}
                  >
                    Nhập điểm (chỉ khi admin chưa khoá)
                  </li>
                </>
              )}

              {/* ✅ menu riêng cho admin */}
              {user.role === "admin" && (
                <>
                  <li
                    className="dropdown-menu--list-item"
                    onClick={() => navigate("/profile/admin/news")}
                  >
                    Quản lý tin tức
                  </li>
                  <li
                    className="dropdown-menu--list-item"
                    onClick={() => navigate("/profile/admin/school")}
                  >
                    Quản lý trường / lớp / học sinh
                  </li>
                  <li
                    className="dropdown-menu--list-item"
                    onClick={() => navigate("/profile/admin/finance")}
                  >
                    Quản lý học phí / chi phí
                  </li>
                  <li
                    className="dropdown-menu--list-item"
                    onClick={() => navigate("/profile/admin/events")}
                  >
                    Quản lý sự kiện
                  </li>
                  <li
                    className="dropdown-menu--list-item"
                    onClick={() => navigate("/profile/admin/lock-scores")}
                  >
                    Khoá / Mở nhập điểm
                  </li>
                </>
              )}

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
        className="creater__user--btn  text__content--size-18 border-register"
        onClick={() => navigate("/register")}
      >
        Đăng ký
      </button>
    </div>
  );
}
