import React, { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { toast, Toaster } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  People as UsersIcon,
} from "@mui/icons-material";

// ================= INTERFACE =================
interface IUser {
  _id: string;
  username: string;
  email: string;
  role: "student" | "teacher" | "parent" | "admin";
  studentId?: string;
  teacherId?: string;
  parentId?: string;
  phone?: string;
  address?: string;
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

    // Optimistic update - cập nhật state ngay lập tức
    setUsers((prev) =>
      prev.map((u) => (u._id === id ? { ...u, isBlocked: !currentStatus } : u)),
    );

    try {
      const response = await axiosInstance.patch(`/users/${id}/block`, {
        isBlocked: !currentStatus,
      });

      toast.success(` ${currentStatus ? "Mở khoá" : "Đình chỉ"} thành công!`);
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật trạng thái:", err);
      toast.error("Cập nhật thất bại");

      // Revert optimistic update nếu có lỗi
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, isBlocked: currentStatus } : u,
        ),
      );
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
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <Toaster position="top-right" reverseOrder={false} />

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 4,
          pb: 2,
          borderBottom: "2px solid #e0e0e0",
        }}
      >
        <UsersIcon sx={{ fontSize: 32, color: "#1976d2" }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
          Quản Lý Người Dùng
        </Typography>
      </Box>

      {/* Search & Filter Card */}
      <Card
        sx={{
          mb: 3,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderRadius: 2,
        }}
      >
        <CardHeader
          title="Tìm Kiếm & Lọc"
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        />
        <CardContent sx={{ pt: 3 }}>
          {/* Search Input */}
          <TextField
            fullWidth
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ mb: 3 }}
          />

          {/* Filter Buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            {["all", "student", "teacher", "parent"].map((role) => (
              <Button
                key={role}
                variant={filterRole === role ? "contained" : "outlined"}
                onClick={() =>
                  setFilterRole(
                    role as "all" | "student" | "teacher" | "parent",
                  )
                }
                sx={{
                  textTransform: "capitalize",
                  background:
                    filterRole === role
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "transparent",
                  color: filterRole === role ? "white" : "#1976d2",
                }}
              >
                {role === "all"
                  ? "Tất cả"
                  : role === "student"
                    ? "Học sinh"
                    : role === "teacher"
                      ? "Giáo viên"
                      : "Phụ huynh"}
              </Button>
            ))}
          </Box>

          {/* Delete Selected Button */}
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={deleteSelectedUsers}
            disabled={selectedUsers.length === 0}
            sx={{
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Xoá {selectedUsers.length > 0 && `(${selectedUsers.length})`}
          </Button>
        </CardContent>
      </Card>

      {/* Users Table Card */}
      <Card
        sx={{
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderRadius: 2,
        }}
      >
        <CardHeader
          title={`Danh Sách Người Dùng (${displayedUsers.length})`}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            "& .MuiTypography-root": { color: "white" },
          }}
        />
        <CardContent sx={{ pt: 0 }}>
          {displayedUsers.length === 0 ? (
            <Typography
              color="textSecondary"
              sx={{ py: 4, textAlign: "center" }}
            >
              Không có người dùng nào phù hợp.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      <Checkbox
                        checked={
                          displayedUsers.length > 0 &&
                          selectedUsers.length === displayedUsers.length
                        }
                        onChange={toggleSelectAll}
                        sx={{ color: "white" }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      Tên đăng nhập
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      Vai trò
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      SĐT
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      Địa chỉ
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      Trạng thái
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      Hành động
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedUsers.map((u, idx) => (
                    <TableRow
                      key={u._id}
                      sx={{
                        backgroundColor: idx % 2 === 0 ? "#f9f9f9" : "white",
                        "&:hover": {
                          backgroundColor: "#f0f0f0",
                        },
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Checkbox
                          checked={selectedUsers.includes(u._id)}
                          onChange={() => toggleSelectUser(u._id)}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2, fontWeight: 500 }}>
                        {u.username}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>{u.email}</TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={
                            u.role === "student"
                              ? "Học sinh"
                              : u.role === "teacher"
                                ? "Giáo viên"
                                : u.role === "parent"
                                  ? "Phụ huynh"
                                  : "Admin"
                          }
                          size="small"
                          color={
                            u.role === "admin"
                              ? "error"
                              : u.role === "teacher"
                                ? "primary"
                                : "default"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>{u.phone || "-"}</TableCell>
                      <TableCell sx={{ py: 2 }}>{u.address || "-"}</TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={u.isBlocked ? "Đình chỉ" : "Hoạt động"}
                          size="small"
                          color={u.isBlocked ? "error" : "success"}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={
                            u.isBlocked ? <LockOpenIcon /> : <LockIcon />
                          }
                          onClick={() =>
                            toggleBlockUser(u._id, u.isBlocked || false)
                          }
                          color={u.isBlocked ? "success" : "warning"}
                          sx={{
                            textTransform: "none",
                          }}
                        >
                          {u.isBlocked ? "Mở khoá" : "Đình chỉ"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
