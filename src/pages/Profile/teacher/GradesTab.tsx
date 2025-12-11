import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../api/axiosConfig";
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import { Save as SaveIcon, Book as BookIcon } from "@mui/icons-material";

interface Student {
  _id: string;
  studentId: string;
  name: string;
}

interface Grade {
  _id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  score: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Subject {
  _id: string;
  name: string;
  classId: string;
}

interface GradeLock {
  isLocked: boolean;
}

interface Props {
  classId?: string;
  teacherId?: string;
}

export default function TeacherGradesTab({ classId, teacherId }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [gradeLock, setGradeLock] = useState<GradeLock | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingGrades, setEditingGrades] = useState<{ [key: string]: number }>(
    {},
  );

  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = classId ? `/classes/${classId}/students` : "/api/students";
        const studentsRes = await axiosInstance.get<{ data: Student[] }>(url);
        setStudents(studentsRes.data?.data || []);

        const subjectsRes = await axiosInstance.get<{ data: Subject[] }>(
          classId ? `/api/subjects/class/${classId}` : "/api/subjects",
        );
        const subjectsList = subjectsRes.data?.data || [];
        setSubjects(subjectsList);
        if (subjectsList.length > 0) {
          setSelectedSubject(subjectsList[0]._id);
        }
      } catch (err) {
        console.error("fetchData error:", err);
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  // Fetch grades và lock status khi chọn môn học
  useEffect(() => {
    const fetchGradesAndLock = async () => {
      if (!selectedSubject || !classId) return;

      setLoading(true);
      try {
        // Fetch grades
        const gradesRes = await axiosInstance.get<{ data: Grade[] }>(
          `/api/grades?subjectId=${selectedSubject}&classId=${classId}`,
        );
        setGrades(gradesRes.data?.data || []);

        // Fetch lock status
        const lockRes = await axiosInstance.get<GradeLock>(
          `/api/grades/lock/status/${classId}/${selectedSubject}`,
        );
        setGradeLock(lockRes.data || null);

        // Initialize editing state
        const initialGrades: { [key: string]: number } = {};
        (gradesRes.data?.data || []).forEach((g) => {
          initialGrades[g.studentId] = g.score;
        });
        setEditingGrades(initialGrades);
      } catch (err) {
        console.error("fetchGradesAndLock error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGradesAndLock();
  }, [selectedSubject, classId]);

  const handleGradeChange = (studentId: string, score: number) => {
    if (gradeLock?.isLocked) {
      toast.error("Điểm của môn học này đã bị khóa, không thể chỉnh sửa");
      return;
    }

    if (score < 0 || score > 10) {
      toast.error("Điểm phải từ 0 đến 10");
      return;
    }

    setEditingGrades((prev) => ({
      ...prev,
      [studentId]: score,
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedSubject || !classId) {
      toast.error("Vui lòng chọn môn học");
      return;
    }

    if (gradeLock?.isLocked) {
      toast.error("Điểm của môn học này đã bị khóa, không thể lưu");
      return;
    }

    setSaving(true);
    try {
      const gradesData = Object.entries(editingGrades).map(
        ([studentId, score]) => ({
          studentId,
          subjectId: selectedSubject,
          classId,
          score,
        }),
      );

      const res = await axiosInstance.post<{
        success: boolean;
        grades: Grade[];
      }>("/api/grades/batch", {
        grades: gradesData,
      });

      if (res.data?.success) {
        toast.success("Lưu điểm thành công");
        // Refetch grades
        const gradesRes = await axiosInstance.get<{ data: Grade[] }>(
          `/api/grades?subjectId=${selectedSubject}&classId=${classId}`,
        );
        setGrades(gradesRes.data?.data || []);
      }
    } catch (err: any) {
      console.error("handleSaveGrades error:", err);
      toast.error(err.response?.data?.message || "Lưu điểm thất bại");
    } finally {
      setSaving(false);
    }
  };

  const currentSubjectName =
    subjects.find((s) => s._id === selectedSubject)?.name || "";

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
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
        <BookIcon sx={{ fontSize: 32, color: "#1976d2" }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
          Nhập Điểm
        </Typography>
      </Box>

      {/* Select Subject Card */}
      <Card
        sx={{
          mb: 3,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderRadius: 2,
        }}
      >
        <CardHeader
          title="Chọn Môn Học"
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        />
        <CardContent sx={{ pt: 3 }}>
          <TextField
            select
            fullWidth
            label="Môn học"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={gradeLock?.isLocked}
            SelectProps={{
              native: true,
            }}
            variant="outlined"
          >
            <option value="">-- Chọn môn học --</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </TextField>
        </CardContent>
      </Card>

      {/* Lock Alert */}
      {gradeLock?.isLocked && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ Điểm của môn học "<strong>{currentSubjectName}</strong>" đã bị khóa
          bởi Admin. Không thể chỉnh sửa hoặc lưu điểm.
        </Alert>
      )}

      {/* Grades Table Card */}
      <Card
        sx={{
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderRadius: 2,
        }}
      >
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Danh Sách Điểm
              </Typography>
              {currentSubjectName && (
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#666",
                    fontStyle: "italic",
                  }}
                >
                  ({currentSubjectName})
                </Typography>
              )}
            </Box>
          }
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            "& .MuiTypography-root": { color: "white" },
          }}
        />
        <CardContent sx={{ pt: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : students.length === 0 ? (
            <Typography color="textSecondary" sx={{ py: 2 }}>
              Chưa có học sinh nào.
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ mb: 3, mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      }}
                    >
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>
                        Mã HS
                      </TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>
                        Tên Học Sinh
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ color: "white", fontWeight: 600 }}
                      >
                        Điểm
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student, idx) => (
                      <TableRow
                        key={student._id}
                        sx={{
                          backgroundColor: idx % 2 === 0 ? "#f9f9f9" : "white",
                          "&:hover": {
                            backgroundColor: "#f0f0f0",
                          },
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          {student.studentId}
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>{student.name}</TableCell>
                        <TableCell align="center" sx={{ py: 2 }}>
                          <TextField
                            type="number"
                            inputProps={{
                              min: "0",
                              max: "10",
                              step: "0.5",
                            }}
                            value={editingGrades[student._id] ?? ""}
                            onChange={(e) =>
                              handleGradeChange(
                                student._id,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            disabled={gradeLock?.isLocked}
                            placeholder="0-10"
                            size="small"
                            sx={{
                              width: "80px",
                              "& input": { textAlign: "center" },
                            }}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  onClick={handleSaveGrades}
                  disabled={saving || gradeLock?.isLocked}
                  variant="contained"
                  startIcon={<SaveIcon />}
                  sx={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    py: 1.5,
                    px: 3,
                    fontSize: "16px",
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #5568d3 0%, #69408f 100%)",
                    },
                  }}
                >
                  {saving ? "Đang lưu..." : "Lưu Điểm"}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
