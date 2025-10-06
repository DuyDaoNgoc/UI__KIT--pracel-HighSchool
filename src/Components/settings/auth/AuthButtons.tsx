// src/components/settings/auth/AuthButtons.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import avatar from "../../../../public/assets/imgs/avatar/avatar.jpg";
import Logout from "../../settings/logout/logout";
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
        navigate("/profile/admin"); // AdminProfile.tsx
        break;
      default:
        navigate("/profile");
    }
  };

  if (user) {
    return (
      <div className="creater__user text__content--size-18">
        <span className="creater__user--color">
          <b>{user.username}</b> ({user.role})
        </span>
        <div className="avatar" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <img
            src={
              user?.avatar
                ? user.avatar.startsWith("http")
                  ? user.avatar // ảnh full URL
                  : `http://localhost:5000/${user.avatar}` // ảnh từ backend (thêm base URL)
                : avatar // ảnh mặc định
            }
            alt="avatar"
            className="avatar-image"
            onError={(e) => (e.currentTarget.src = avatar)} // fallback nếu ảnh lỗi
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

              {/* Menu học sinh */}
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

              {/* Menu phụ huynh */}
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

              {/* Menu giáo viên */}
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
                    Nhập điểm
                  </li>
                </>
              )}

              {/* Menu admin */}
              {user.role === "admin" && <></>}

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
        className="creater__user--btn text__content--size-18"
        onClick={() => navigate("/login")}
      >
        Đăng nhập
      </button>
      <button
        className="creater__user--btn text__content--size-18 border-register"
        onClick={() => navigate("/register")}
      >
        Đăng ký
      </button>
    </div>
  );
}
