// src/pages/Profile/admin/Class/CreateClass.tsx
import React, { useState, useEffect } from "react";
import { ICreatedStudent } from "../../../../types/student";
import axiosInstance from "../../../../api/axiosConfig";
import { createClass } from "./settings/createClassAPI";
import { updateClass } from "./settings/updateClassAPI";
import { getClasses } from "./settings/getClassesAPI";
import { deleteClass } from "./settings/deleteClassAPI";
import { toast, Toaster } from "react-hot-toast";
import { generateClassCode } from "../../../../../server/helpers/classCode";
import { ObjectId } from "mongodb";
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  School as SchoolIcon,
} from "@mui/icons-material";

interface ClassType {
  _id: string | ObjectId;
  grade: string;
  schoolYear: string;
  classLetter: string;
  major: string;
  classCode: string;
  createdAt?: Date | string | null;
}

const CreateClass: React.FC = () => {
  const [formData, setFormData] = useState({
    grade: "",
    schoolYear: "",
    classLetter: "",
    major: "",
    classCode: "",
  });

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | ObjectId | null>(
    null,
  );

  // Fetch danh sách lớp
  const fetchClasses = async () => {
    try {
      const res = await getClasses();
      if (res && res.success && Array.isArray(res.data)) {
        setClasses(res.data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách lớp!");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Cập nhật formData và tự sinh classCode
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (["grade", "classLetter", "major"].includes(name)) {
        updated.classCode = generateClassCode(
          updated.grade,
          updated.classLetter,
          updated.major,
        );
      }
      return updated;
    });
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.grade.trim() ||
      !formData.schoolYear.trim() ||
      !formData.classLetter.trim() ||
      !formData.classCode.trim()
    ) {
      toast.error(" Vui lòng nhập đủ thông tin!");
      return;
    }

    const payload = { ...formData };

    setLoading(true);
    try {
      const res =
        editingId !== null
          ? await updateClass(editingId, payload)
          : await createClass(payload);

      if (res && res.success) {
        toast.success(
          editingId ? "Cập nhật thành công!" : "Tạo lớp thành công!",
        );
        await fetchClasses();
        setFormData({
          grade: "",
          schoolYear: "",
          classLetter: "",
          major: "",
          classCode: "",
        });
        setEditingId(null);
      } else {
        toast.error(res?.message || "❌ Lỗi tạo/cập nhật lớp!");
      }
    } catch (err: any) {
      console.error("Lỗi khi tạo/cập nhật lớp:", err);
      toast.error("Lỗi máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  // Xóa lớp
  const handleDelete = async (id: string | ObjectId) => {
    if (!window.confirm("Xóa lớp này?")) return;
    try {
      const res = await deleteClass(id.toString());
      if (res?.success) {
        toast.success("🗑️ Đã xóa lớp");
        fetchClasses();
      } else {
        toast.error("Xóa thất bại!");
      }
    } catch (error) {
      toast.error("Lỗi khi xóa lớp!");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setOpenDeleteDialog(false);
    await handleDelete(deleteTarget);
    setDeleteTarget(null);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
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
        <SchoolIcon sx={{ fontSize: 32, color: "#1976d2" }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
          Quản Lý Lớp Học
        </Typography>
      </Box>

      {/* Form Card */}
      <Card
        sx={{
          mb: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderRadius: 2,
        }}
      >
        <CardHeader
          title={editingId ? "Cập Nhật Lớp Học" : "Tạo Lớp Học Mới"}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="Khối"
                name="grade"
                placeholder="VD: 10, 11, 12"
                value={formData.grade}
                onChange={handleChange}
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Năm Học"
                name="schoolYear"
                placeholder="VD: 2024-2025"
                value={formData.schoolYear}
                onChange={handleChange}
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Tên Lớp"
                name="classLetter"
                placeholder="VD: A, B, C"
                value={formData.classLetter}
                onChange={handleChange}
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Chuyên Ngành"
                name="major"
                placeholder="VD: Toán, Văn, Anh"
                value={formData.major}
                onChange={handleChange}
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Mã Lớp"
                name="classCode"
                placeholder="Tự sinh"
                value={formData.classCode}
                inputProps={{ readOnly: true }}
                variant="outlined"
                size="small"
                sx={{
                  backgroundColor: "#f5f5f5",
                  gridColumn: "1 / -1",
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                startIcon={editingId ? <EditIcon /> : <AddIcon />}
                sx={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  py: 1.5,
                  fontSize: "16px",
                  fontWeight: 600,
                  textTransform: "none",
                  gridColumn: "1 / -1",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #5568d3 0%, #69408f 100%)",
                  },
                }}
              >
                {loading
                  ? "Đang lưu..."
                  : editingId
                    ? "Cập Nhật Lớp"
                    : "Tạo Lớp Mới"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Classes List */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Danh Sách Lớp ({classes.length})
        </Typography>

        {classes.length === 0 ? (
          <Card
            sx={{
              p: 4,
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <Typography color="textSecondary">
              Chưa có lớp nào. Hãy tạo lớp đầu tiên!
            </Typography>
          </Card>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {classes.map((cls) => (
              <Card
                key={cls._id?.toString()}
                sx={{
                  height: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardHeader
                  title={`${cls.grade}${cls.classLetter}`}
                  subheader={cls.major}
                  sx={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    pb: 1.5,
                    "& .MuiCardHeader-subheader": {
                      color: "rgba(255,255,255,0.85)",
                    },
                  }}
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={`Năm: ${cls.schoolYear || "N/A"}`}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`Mã: ${cls.classCode}`}
                      size="small"
                      variant="filled"
                      sx={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "#999", display: "block", mb: 2 }}
                  >
                    Tạo:{" "}
                    {cls.createdAt
                      ? new Date(cls.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "-"}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      justifyContent: "flex-end",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => {
                        setFormData({
                          grade: cls.grade,
                          schoolYear: cls.schoolYear,
                          classLetter: cls.classLetter,
                          major: cls.major,
                          classCode: cls.classCode,
                        });
                        setEditingId(cls._id?.toString() || null);
                      }}
                      sx={{
                        color: "#ff9800",
                        "&:hover": { backgroundColor: "rgba(255,152,0,0.08)" },
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setDeleteTarget(cls._id);
                        setOpenDeleteDialog(true);
                      }}
                      sx={{
                        color: "#f44336",
                        "&:hover": { backgroundColor: "rgba(244,67,54,0.08)" },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: "#d32f2f" }}>
          Xác Nhận Xóa Lớp
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            Bạn có chắc muốn xóa lớp này? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} variant="outlined">
            Hủy
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CreateClass;
