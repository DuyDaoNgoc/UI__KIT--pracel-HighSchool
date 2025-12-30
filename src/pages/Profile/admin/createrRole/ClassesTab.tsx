import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../api/axiosConfig";
import { ICreatedStudent } from "../../../../types/student";
import StudentModal from "../StudentModal";
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Paper,
  Collapse,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as GroupIcon,
} from "@mui/icons-material";

interface ClassData {
  _id: string;
  classCode: string;
  teacherName?: string;
  students: ICreatedStudent[];
}

interface ClassesTabProps {
  deleteStudent?: (studentId: string) => Promise<void> | void;
}

export default function ClassesTab({
  deleteStudent: deleteStudentProp,
}: ClassesTabProps) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<{ _id: string; name: string }[]>([]);
  const [openClassKey, setOpenClassKey] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<ICreatedStudent | null>(null);
  const [loading, setLoading] = useState(false);
  const [reloadClasses, setReloadClasses] = useState(false);
  const [search, setSearch] = useState(""); // ✅ state tìm kiếm

  // ========================= HELPERS: normalizeMajor + extractMajorFromClassCode =========================
  // Chuẩn hóa ngành -> Viết tắt theo chữ cái đầu (Công Nghệ Thông Tin -> CNTT)
  const normalizeMajor = (major?: string): string => {
    if (!major) return "Chưa xác định";

    const clean = major.trim();

    // Nếu đã là viết tắt (1 từ, không có khoảng trắng) -> giữ uppercase
    if (/^[A-Za-zÀ-ỹ]+$/.test(clean) && !clean.includes(" ")) {
      return clean.toUpperCase();
    }

    // Tách theo khoảng trắng -> lấy chữ cái đầu mỗi từ
    const parts = clean.split(/\s+/);
    const acronym = parts.map((w) => w[0]?.toUpperCase() ?? "").join("");

    return acronym || "Chưa xác định";
  };

  // Tách ngành từ classCode
  // Các dạng thông dụng:
  //  - "26A-CNTT" -> "CNTT"
  //  - "26ACNTT"  -> try fallback: lấy phần chữ in hoa cuối cùng
  //  - nếu không có dấu '-' và không parse được -> "Chưa xác định"
  const extractMajorFromClassCode = (code?: string): string => {
    if (!code) return "Chưa xác định";

    // Nếu có '-', phần sau '-' là ngành
    if (code.includes("-")) {
      const parts = code.split("-");
      const last = parts[parts.length - 1].trim();
      if (last) return last.toUpperCase();
    }

    // Nếu không có '-', thử match phần chữ in hoa cuối cùng (VD: 26ACNTT)
    const match = code.match(/[A-Z]{2,}$/i);
    if (match) return match[0].toUpperCase();

    return "Chưa xác định";
  };

  // Utility: thêm class vào nhóm major mà không duplicate
  const pushUnique = (
    grouped: { [major: string]: ClassData[] },
    major: string,
    cls: ClassData,
  ) => {
    if (!grouped[major]) grouped[major] = [];
    const exists = grouped[major].some((c) => c._id === cls._id);
    if (!exists) grouped[major].push(cls);
  };

  // ========================= FETCH DANH SÁCH GIÁO VIÊN =========================
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axiosInstance.get<{
          data: { _id: string; name: string }[];
        }>("/teachers");
        setTeachers(res.data?.data || []);
      } catch (err) {
        console.error("fetchTeachers error:", err);
      }
    };
    fetchTeachers();
  }, []);

  // ========================= FETCH DANH SÁCH LỚP =========================
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get<{ data: any[] }>("/classes");

        const mapped: ClassData[] = (res.data?.data || []).map((cls: any) => {
          let students: ICreatedStudent[] = (cls.students || []).map(
            (s: any) => ({
              _id: s._id,
              studentId: s.studentId || "-",
              name: s.name || s.username || "-",
              dob: s.dob || "-",
              address: s.address || "-",
              residence: s.residence || "-",
              phone: s.phone || "-",
              grade: s.grade || cls.grade,
              classLetter: s.classLetter || cls.classLetter,
              schoolYear: s.schoolYear || cls.schoolYear,
              classCode: cls.classCode,
              teacherName: cls.teacherName || "Chưa gán",
              major: normalizeMajor(s.major),
              email: s.email || "",
              createdAt: s.createdAt || null,
            }),
          );

          // Loại bỏ học sinh không tồn tại
          students = students.filter(
            (s) => s._id && s.name && s.studentId !== "-",
          );

          return {
            _id: cls._id || cls.classCode,
            classCode: cls.classCode,
            teacherName: cls.teacherName || "Chưa gán",
            students,
          };
        });

        setClasses(mapped);
      } catch (err) {
        console.error("fetchClasses error:", err);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [reloadClasses]);

  // ========================= TOGGLE LỚP =========================
  const toggleClass = (key: string) => {
    setOpenClassKey(openClassKey === key ? null : key);
    setSelectedStudent(null);
  };

  // ========================= HANDLE STUDENT ADDED / DELETED =========================
  useEffect(() => {
    const handleStudentAdded = (e: any) => {
      const student: ICreatedStudent = e.detail;
      setClasses((prev) =>
        prev.map((cls) => {
          if (
            cls.classCode === student.classCode &&
            !cls.students.some((s) => s._id === student._id)
          ) {
            return { ...cls, students: [...cls.students, student] };
          }
          return cls;
        }),
      );
    };

    const handleStudentDeleted = (e: any) => {
      const studentId: string = e.detail._id;
      setClasses((prev) =>
        prev.map((cls) => ({
          ...cls,
          students: cls.students.filter((s) => s._id !== studentId),
        })),
      );
    };

    window.addEventListener("studentAddedToClass", handleStudentAdded);
    window.addEventListener("studentDeletedFromClass", handleStudentDeleted);
    return () => {
      window.removeEventListener("studentAddedToClass", handleStudentAdded);
      window.removeEventListener(
        "studentDeletedFromClass",
        handleStudentDeleted,
      );
    };
  }, []);

  // Rút gọn ngành thành viết tắt (CNTT, QTKD, etc.)
  const majorAbbrev = (major?: string): string => {
    if (!major) return "";
    return major
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() : ""))
      .join("");
  };

  // Tạo class code từ khối, lớp, và ngành
  const generateClassCode = (
    grade?: string,
    classLetter?: string,
    major?: string,
  ): string => {
    const g = grade || "X";
    const c = classLetter || "X";
    const abbr = majorAbbrev(major || "");
    return `${g}${c}${abbr}`;
  };

  const formatDate = (dob?: string) =>
    dob ? new Date(dob).toLocaleDateString("vi-VN") : "-";

  const getClassesByMajor = () => {
    const grouped: { [major: string]: ClassData[] } = {};

    classes.forEach((cls) => {
      // Chỉ lấy ngành từ classCode — đúng yêu cầu
      const classMajor = extractMajorFromClassCode(cls.classCode);

      if (!grouped[classMajor]) grouped[classMajor] = [];
      grouped[classMajor].push(cls);
    });

    // ========================= Lọc theo search =========================
    if (search.trim()) {
      const lower = search.trim().toLowerCase();
      Object.keys(grouped).forEach((major) => {
        grouped[major] = grouped[major].filter(
          (cls) =>
            cls.classCode.toLowerCase().includes(lower) ||
            cls.teacherName?.toLowerCase().includes(lower) ||
            major.toLowerCase().includes(lower),
        );
      });

      // Remove majors that have no classes after filtering to avoid empty headers
      Object.keys(grouped).forEach((major) => {
        if (!grouped[major] || grouped[major].length === 0) {
          delete grouped[major];
        }
      });
    }

    return grouped;
  };

  const classesByMajor = getClassesByMajor();

  // ========================= RENDER =========================
  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
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
        <GroupIcon sx={{ fontSize: 32, color: "#1976d2" }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
          Quản Lý Lớp
        </Typography>
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Tìm kiếm lớp, ngành, giáo viên..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        variant="outlined"
        size="small"
        sx={{ mb: 4 }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : Object.keys(classesByMajor).length === 0 ? (
        <Typography color="textSecondary" sx={{ py: 2, textAlign: "center" }}>
          Chưa có lớp nào.
        </Typography>
      ) : (
        Object.keys(classesByMajor).map((major) => (
          <Box key={major} sx={{ mb: 3 }}>
            {/* Major Header Card */}
            <Card
              sx={{
                mb: 2,
                background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                color: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {major}
                    </Typography>
                    <Chip
                      label={`${classesByMajor[major].length} lớp`}
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.3)",
                        color: "white",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                }
                sx={{ pb: 1 }}
              />
            </Card>

            {/* Classes Grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 2,
              }}
            >
              {classesByMajor[major].map((cls) => {
                const isOpen = openClassKey === cls.classCode;
                return (
                  <Box key={cls._id}>
                    <Card
                      sx={{
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        borderRadius: 2,
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        "&:hover": {
                          transform: !isOpen ? "translateY(-4px)" : "none",
                          boxShadow: !isOpen
                            ? "0 8px 16px rgba(0,0,0,0.12)"
                            : "0 2px 8px rgba(0,0,0,0.08)",
                        },
                      }}
                    >
                      <CardHeader
                        title={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              sx={{ fontWeight: 600, color: "#1976d2" }}
                            >
                              {cls.classCode}
                            </Typography>
                            <Chip
                              label={`${cls.students.length} HS`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        }
                        sx={{
                          background:
                            "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
                          pb: 1,
                        }}
                      />
                      <CardContent sx={{ pt: 0 }}>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ mb: 2 }}
                        >
                          <strong>GV phụ trách:</strong>{" "}
                          {cls.teacherName || "Chưa gán"}
                        </Typography>

                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          onClick={() => toggleClass(cls.classCode)}
                          endIcon={
                            isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />
                          }
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            background: isOpen
                              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                              : "linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%)",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 4px 12px rgba(100, 181, 246, 0.4)",
                            },
                          }}
                        >
                          {isOpen ? "Ẩn" : "Xem"} danh sách (
                          {cls.students.length} HS)
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Expanded Table - Full Width Below Card */}
                    {isOpen && (
                      <Box
                        sx={{
                          mt: 2,
                          animation:
                            "slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                          "@keyframes slideDown": {
                            from: {
                              opacity: 0,
                              transform: "translateY(-20px)",
                            },
                            to: {
                              opacity: 1,
                              transform: "translateY(0)",
                            },
                          },
                        }}
                      >
                        {cls.students.length === 0 ? (
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{
                              py: 2,
                              textAlign: "center",
                              backgroundColor: "#f9f9f9",
                              borderRadius: 1,
                            }}
                          >
                            Không có học sinh
                          </Typography>
                        ) : (
                          <TableContainer
                            component={Paper}
                            sx={{
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              borderRadius: 1,
                            }}
                          >
                            <Table size="small">
                              <TableHead>
                                <TableRow
                                  sx={{
                                    background:
                                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                  }}
                                >
                                  <TableCell
                                    sx={{ fontWeight: 600, color: "white" }}
                                  >
                                    Mã HS
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600, color: "white" }}
                                  >
                                    Tên
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600, color: "white" }}
                                  >
                                    Năm Sinh
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600, color: "white" }}
                                  >
                                    Niên khóa
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600, color: "white" }}
                                  >
                                    Lớp
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600, color: "white" }}
                                  >
                                    SĐT
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600, color: "white" }}
                                  >
                                    Email
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600, color: "white" }}
                                  >
                                    Địa chỉ
                                  </TableCell>
                                  <TableCell
                                    sx={{ fontWeight: 600, color: "white" }}
                                  >
                                    Hành động
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {cls.students.map((s, idx) => (
                                  <TableRow
                                    key={s._id}
                                    sx={{
                                      backgroundColor:
                                        idx % 2 === 0 ? "#f9f9f9" : "white",
                                      "&:hover": {
                                        backgroundColor: "#f0f0f0",
                                      },
                                    }}
                                  >
                                    <TableCell sx={{ fontSize: "12px" }}>
                                      {s.studentId}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "12px" }}>
                                      {s.name}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "12px" }}>
                                      {formatDate(s.dob)}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "12px" }}>
                                      {s.schoolYear || "-"}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "12px" }}>
                                      {s.classCode || "-"}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "12px" }}>
                                      {s.phone || "-"}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "12px" }}>
                                      {s.email || "-"}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "12px" }}>
                                      {s.address || "-"}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: "12px" }}>
                                      <Button
                                        size="small"
                                        variant="text"
                                        onClick={() => setSelectedStudent(s)}
                                        sx={{
                                          textTransform: "none",
                                          color: "#1976d2",
                                          fontWeight: 500,
                                        }}
                                      >
                                        Xem
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))
      )}

      {/* Modal */}
      <StudentModal
        viewing={!!selectedStudent}
        selectedStudent={selectedStudent}
        closeView={() => setSelectedStudent(null)}
        assignTeacher={(id: string) => console.log("assignTeacher", id)}
        deleteStudent={async (id: string) => {
          if (!id) return false;
          try {
            if (deleteStudentProp) {
              await deleteStudentProp(id);
            }

            // notify local classes state to remove student
            window.dispatchEvent(
              new CustomEvent("studentDeletedFromClass", {
                detail: { _id: id },
              }),
            );
            setSelectedStudent(null);
            return true;
          } catch (err) {
            console.error("ClassesTab.deleteStudent error:", err);
            return false;
          }
        }}
        generateClassCode={generateClassCode}
      />
    </div>
  );
}
