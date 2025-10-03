import React, { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosConfig";

interface IUser {
  _id: string;
  username: string;
  email: string;
  role: "student" | "teacher" | "parent" | "admin";
  studentId?: string;
  teacherId?: string;
  parentId?: string;
  isBlocked?: boolean;
  createdAt?: string;
  classCode?: string; // lớp đầy đủ
  major?: string; // ngành
}

export default function UserManagement() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<
    "all" | "student" | "teacher" | "parent"
  >("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get<IUser[]>("/users");
      const filtered = (res.data || [])
        .filter((u) => u.role !== "admin") // ẩn admin
        .map((u) => ({
          ...u,
          classCode: u.classCode || "---",
          major: u.major || "---",
        }));
      setUsers(filtered);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách người dùng:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBlockUser = async (id: string, currentStatus: boolean) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn ${
          currentStatus ? "mở khoá" : "đình chỉ"
        } tài khoản này?`
      )
    )
      return;
    try {
      await axiosInstance.patch(`/users/${id}/block`, {
        isBlocked: !currentStatus,
      });
      alert(`✅ ${currentStatus ? "Mở khoá" : "Đình chỉ"} thành công!`);
      fetchUsers();
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật trạng thái:", err);
      alert("❌ Không thể cập nhật trạng thái người dùng.");
    }
  };

  const deleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      alert("⚠️ Chưa chọn tài khoản nào để xoá.");
      return;
    }
    if (
      !window.confirm(
        `Bạn có chắc muốn xoá ${selectedUsers.length} tài khoản này?`
      )
    )
      return;

    try {
      await Promise.all(
        selectedUsers.map((id) => axiosInstance.delete(`/users/${id}`))
      );
      alert("🗑️ Xoá tài khoản thành công!");
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      console.error("❌ Lỗi khi xoá người dùng:", err);
      alert("❌ Không thể xoá tài khoản.");
    }
  };

  const displayedUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const toggleSelectUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === displayedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(displayedUsers.map((u) => u._id));
    }
  };

  return (
    <div className="user-management">
      <h2 className="user-management__title">Quản lý người dùng</h2>

      {/* 🔍 Tìm kiếm */}
      <input
        type="text"
        placeholder="Tìm theo tên hoặc email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="user-search"
      />

      {/* 🎛️ Bộ lọc vai trò */}
      <div className="role-filters">
        <button
          className={filterRole === "student" ? "active" : ""}
          onClick={() => setFilterRole("student")}
        >
          Học sinh
        </button>
        <button
          className={filterRole === "teacher" ? "active" : ""}
          onClick={() => setFilterRole("teacher")}
        >
          Giáo viên
        </button>
        <button
          className={filterRole === "parent" ? "active" : ""}
          onClick={() => setFilterRole("parent")}
        >
          Phụ huynh
        </button>
        <button
          className={filterRole === "all" ? "active" : ""}
          onClick={() => setFilterRole("all")}
        >
          Tất cả
        </button>
      </div>

      {/* 🗑️ Nút xoá */}
      <div style={{ margin: "10px 0" }}>
        <button
          className="delete-btn"
          onClick={deleteSelectedUsers}
          disabled={selectedUsers.length === 0}
        >
          🗑️ Xoá tài khoản đã chọn ({selectedUsers.length})
        </button>
      </div>

      <table className="user-table">
        <thead className="user-table__head">
          <tr>
            <th>
              <input
                type="checkbox"
                checked={
                  displayedUsers.length > 0 &&
                  selectedUsers.length === displayedUsers.length
                }
                onChange={toggleSelectAll}
              />
            </th>
            <th>Tên đăng nhập</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Mã học sinh</th>
            <th>Mã giáo viên</th>
            <th>Mã phụ huynh</th>
            <th>Lớp</th>
            <th>Ngành</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {displayedUsers.length > 0 ? (
            displayedUsers.map((u) => (
              <tr key={u._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u._id)}
                    onChange={() => toggleSelectUser(u._id)}
                  />
                </td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.studentId || "---"}</td>
                <td>{u.teacherId || "---"}</td>
                <td>{u.parentId || "---"}</td>
                <td>{u.classCode}</td>
                <td>{u.major}</td>
                <td>{u.isBlocked ? "🚫 Đình chỉ" : "✅ Hoạt động"}</td>
                <td>
                  <button
                    className={u.isBlocked ? "unblock-btn" : "block-btn"}
                    onClick={() => toggleBlockUser(u._id, u.isBlocked || false)}
                  >
                    {u.isBlocked ? "Mở khoá" : "Đình chỉ"}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={11} style={{ textAlign: "center" }}>
                Không có người dùng nào phù hợp.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
