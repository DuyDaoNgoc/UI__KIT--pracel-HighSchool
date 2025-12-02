import React, { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { toast, Toaster } from "react-hot-toast";

// ================= INTERFACE =================
interface IUser {
  _id: string;
  username: string;
  email: string;
  role: "student" | "teacher" | "parent" | "admin";
  studentId?: string;
  teacherId?: string;
  parentId?: string;
  phone?: string; // ✅ thêm SDT
  address?: string; // ✅ thêm địa chỉ
  isBlocked?: boolean;
  createdAt?: string;
  classCode?: { className: string; grade: string } | string;
  major?: { name: string; code: string } | string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<
    "all" | "student" | "teacher" | "parent"
  >("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // ================= API =================
  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get<IUser[]>("/users");
      const filtered = (res.data || []).filter((u) => u.role !== "admin");
      setUsers(filtered);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ================= ACTION =================
  const toggleBlockUser = async (id: string, currentStatus: boolean) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn ${
          currentStatus ? "mở khoá" : "đình chỉ"
        } tài khoản này?`,
      )
    )
      return;
    try {
      await axiosInstance.patch(`/users/${id}/block`, {
        isBlocked: !currentStatus,
      });
      toast.success(` ${currentStatus ? "Mở khoá" : "Đình chỉ"} thành công!`);
      fetchUsers();
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật trạng thái:", err);
    }
  };

  const deleteSelectedUsers = async () => {
    if (selectedUsers.length === 0)
      return toast.error(" Chưa chọn tài khoản nào để xoá.");
    if (
      !window.confirm(
        `Bạn có chắc muốn xoá ${selectedUsers.length} tài khoản này?`,
      )
    )
      return;

    try {
      await Promise.all(
        selectedUsers.map((id) => axiosInstance.delete(`/users/${id}`)),
      );
      toast.success("🗑️ Xoá thành công!");
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      console.error("❌ Lỗi xoá:", err);
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
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === displayedUsers.length
        ? []
        : displayedUsers.map((u) => u._id),
    );
  };

  // ================= RENDER =================
  return (
    <div className="teacher">
      <h2 className="teacher__title">Quản lý người dùng</h2>

      <input
        type="text"
        placeholder="Tìm theo tên hoặc email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="teacher-form__input"
      />

      <div className="teacher-form__actions">
        <button
          className={`teacher-form__button ${
            filterRole === "student" ? "active" : ""
          }`}
          onClick={() => setFilterRole("student")}
        >
          Học sinh
        </button>
        <button
          className={`teacher-form__button ${
            filterRole === "teacher" ? "active" : ""
          }`}
          onClick={() => setFilterRole("teacher")}
        >
          Giáo viên
        </button>
        <button
          className={`teacher-form__button ${
            filterRole === "parent" ? "active" : ""
          }`}
          onClick={() => setFilterRole("parent")}
        >
          Phụ huynh
        </button>
        <button
          className={`teacher-form__button ${
            filterRole === "all" ? "active" : ""
          }`}
          onClick={() => setFilterRole("all")}
        >
          Tất cả
        </button>
      </div>
      <div className="teacher-form__actions">
        <button
          className="teacher-form__button teacher-form__button--cancel"
          onClick={deleteSelectedUsers}
          disabled={selectedUsers.length === 0}
        >
          Xoá tài khoản đã chọn ({selectedUsers.length})
        </button>
      </div>

      <table className="teacher-table">
        <thead className="teacher-table__head">
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
            <th>Mã HS</th>
            <th>Mã GV</th>
            <th>Mã PH</th>
            <th>Lớp</th>
            <th>Ngành</th>
            <th> SĐT</th>
            <th> Địa chỉ</th>
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
                <td>{u.studentId || <span className="red">None</span>}</td>
                <td>{u.teacherId || <span className="red">None</span>}</td>
                <td>{u.parentId || <span className="red">None</span>}</td>
                <td>
                  {typeof u.classCode === "string"
                    ? u.classCode
                    : u.classCode
                      ? `${u.classCode.className} (${u.classCode.grade})`
                      : "---"}
                </td>
                <td>
                  {typeof u.major === "string"
                    ? u.major
                    : u.major
                      ? `${u.major.name} (${u.major.code})`
                      : "---"}
                </td>
                <td>{u.phone || "---"}</td> {/* ✅ render SĐT */}
                <td>{u.address || "---"}</td> {/* ✅ render địa chỉ */}
                <td>{u.isBlocked ? "🚫 Đình chỉ" : "✅ Hoạt động"}</td>
                <td>
                  <button
                    className={`teacher-table__button ${
                      u.isBlocked
                        ? "teacher-table__button--edit"
                        : "teacher-table__button--delete"
                    }`}
                    onClick={() => toggleBlockUser(u._id, u.isBlocked || false)}
                  >
                    {u.isBlocked ? "Mở khoá" : "Đình chỉ"}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={13} style={{ textAlign: "center" }}>
                Không có người dùng nào phù hợp.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
