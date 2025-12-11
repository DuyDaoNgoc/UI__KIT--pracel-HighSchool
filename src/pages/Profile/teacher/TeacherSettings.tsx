import React from "react";
import { IUserProfile } from "../../../types/profiles";

interface Props {
  user: IUserProfile;
}

export default function TeacherSettings({ user }: Props) {
  return (
    <div className="profile__card">
      <h2>Cài đặt</h2>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
          marginBottom: "1rem",
        }}
      >
        <h3>Thông tin tài khoản</h3>
        <p>
          <b>Tên đăng nhập:</b> {user.username}
        </p>
        <p>
          <b>Email:</b> {user.email}
        </p>
        <p>
          <b>Role:</b> {user.role}
        </p>
      </div>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "#fff3cd",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>⚙️ Các tùy chọn khác</h3>
        <ul>
          <li>Thay đổi mật khẩu (sắp ra mắt)</li>
          <li>Cập nhật thông tin cá nhân (sắp ra mắt)</li>
          <li>Quản lý thông báo (sắp ra mắt)</li>
        </ul>
      </div>
    </div>
  );
}
