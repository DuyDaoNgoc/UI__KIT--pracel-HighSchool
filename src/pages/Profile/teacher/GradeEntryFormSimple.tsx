import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../api/axiosConfig";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Save as SaveIcon,
  Send as SendIcon,
  BookOutlined as BookIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../context/AuthContext";
import { IUserProfile } from "../../../types/profiles";
import "../../../stylesheets/components/profile/GradeEntryFormPro.scss";

interface Student {
  _id: string;
  studentId: string;
  name: string;
  email?: string;
  userId?: string;
}

interface GradeEntry {
  type:
    | "oral"
    | "test15"
    | "test1period"
    | "midterm"
    | "semester1"
    | "semester2"
    | "final";
  score: number;
  date?: string;
  note?: string;
}

interface Grade {
  _id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  grades: GradeEntry[];
  averageScore?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ScheduleItem {
  _id?: string;
  day: string;
  subject: string;
  subjectId?: { _id: string; name: string } | string;
  startTime: string;
  endTime: string;
}

interface Class {
  _id: string;
  classCode: string;
  grade: string;
  classLetter: string;
  students: any[];
}

interface GradeLock {
  isLocked: boolean;
}

interface GradeData {
  [studentId: string]: {
    [gradeType: string]: number;
  };
}

export default function GradeEntryFormPro() {
  const { user: authUser } = useAuth() as { user: IUserProfile | null };

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradeLock, setGradeLock] = useState<GradeLock | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingGrades, setEditingGrades] = useState<GradeData>({});
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [sendToStudents, setSendToStudents] = useState(true);
  const [sendToAdmin, setSendToAdmin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const GRADE_TYPES = [
    { key: "oral", label: "Miệng", short: "M" },
    { key: "test15", label: "15 phút", short: "15p" },
    { key: "test1period", label: "1 tiết", short: "1t" },
    { key: "midterm", label: "Giữa kì", short: "GK" },
    { key: "semester1", label: "HK 1", short: "HK1" },
    { key: "semester2", label: "HK 2", short: "HK2" },
    { key: "final", label: "Cuối kì", short: "CK" },
  ];

  // Fetch classes
  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (!authUser?.teacherId) return;
      setLoading(true);
      try {
        const res = await axiosInstance.get<{ data: Class[] }>("/classes");
        setClasses(res.data?.data || []);
      } catch (err) {
        console.error("fetchTeacherClasses error:", err);
        toast.error("Lỗi tải danh sách lớp dạy");
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherClasses();
  }, [authUser]);

  // Fetch students and subjects when class changes
  useEffect(() => {
    const fetchStudentsAndSubjects = async () => {
      if (!selectedClass) {
        setStudents([]);
        setSubjects([]);
        setSelectedSubject("");
        setEditingGrades({});
        return;
      }

      setLoading(true);
      try {
        const classesRes = await axiosInstance.get<{
          success: boolean;
          data: Class[];
        }>(`/classes`);
        const classes = classesRes.data?.data || [];
        const selectedClassData = classes.find(
          (c: any) => String(c._id) === String(selectedClass),
        );
        setStudents(selectedClassData?.students || []);

        // Get subjects from timetable for this class
        // This ensures teachers only grade subjects they actually teach in this class
        const timetableRes = await axiosInstance.get<{
          data: {
            schedule: Array<{
              subjectId: { _id: string; name: string } | string;
            }>;
          };
        }>(`/timetables/class/${selectedClass}`);

        const timetable = timetableRes.data?.data;
        if (timetable?.schedule && timetable.schedule.length > 0) {
          // Extract unique subjects from timetable schedule by subjectId
          const uniqueSubjects = new Map<
            string,
            { _id: string; name: string }
          >();

          timetable.schedule.forEach((item: any) => {
            if (!item.subjectId) return;

            // Extract ID safely from both string and object formats
            let subjectId = "";
            let subjectName = "";

            if (typeof item.subjectId === "string") {
              subjectId = item.subjectId;
              subjectName = item.subject || "Chưa xác định";
            } else if (item.subjectId && typeof item.subjectId === "object") {
              subjectId = item.subjectId._id || item.subjectId.id || "";
              subjectName = item.subjectId.name || "Chưa xác định";
            }

            // Add to map only if this ID hasn't been added yet (automatic deduplication)
            if (subjectId && !uniqueSubjects.has(subjectId)) {
              uniqueSubjects.set(subjectId, {
                _id: subjectId,
                name: subjectName,
              });
            }
          });

          setSubjects(Array.from(uniqueSubjects.values()));
        } else {
          setSubjects([]);
        }

        setSelectedSubject("");
        setEditingGrades({});
      } catch (err) {
        console.error("fetchStudentsAndSubjects error:", err);
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndSubjects();
  }, [selectedClass]);

  // Fetch grades when subject changes
  useEffect(() => {
    const fetchGrades = async () => {
      if (!selectedSubject || !selectedClass) {
        setGrades([]);
        setEditingGrades({});
        return;
      }

      setLoading(true);
      try {
        const res = await axiosInstance.get<{ data: Grade[] }>(
          `/grades?subjectId=${selectedSubject}&classId=${selectedClass}`,
        );

        const gradesData = res.data?.data || [];
        setGrades(gradesData);

        // Initialize editing state with existing grades
        const initialGrades: GradeData = {};
        gradesData.forEach((g) => {
          initialGrades[g.studentId] = {};
          g.grades?.forEach((ge) => {
            initialGrades[g.studentId][ge.type] = ge.score;
          });
        });
        setEditingGrades(initialGrades);
      } catch (err) {
        console.error("fetchGrades error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [selectedSubject, selectedClass]);

  const calculateAverage = (studentId: string): number => {
    const scores = editingGrades[studentId] || {};
    const values = Object.values(scores).filter((v): v is number => v > 0);
    if (values.length === 0) return 0;
    return (
      Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
    );
  };

  const getResult = (average: number): "Đạt" | "Không đạt" => {
    return average >= 5 ? "Đạt" : "Không đạt";
  };

  // Filter students - only show those with valid _id, studentId and name
  const validStudents = students.filter(
    (s): s is Student =>
      Boolean(s) &&
      typeof s === "object" &&
      Boolean(s._id) &&
      Boolean(s.studentId) &&
      Boolean(s.name),
  );

  const handleGradeChange = (
    studentId: string,
    gradeType: string,
    score: number | string,
  ) => {
    if (gradeLock?.isLocked) {
      toast.error("Điểm đã bị khóa");
      return;
    }

    const numScore = typeof score === "string" ? parseFloat(score) : score;
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      return; // Silently ignore invalid input
    }

    setEditingGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [gradeType]: numScore,
      },
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedClass || !selectedSubject) {
      toast.error("Vui lòng chọn lớp và môn học");
      return;
    }

    const subjectId = selectedSubject;
    if (!subjectId) {
      toast.error("Không tìm thấy môn học");
      return;
    }

    if (gradeLock?.isLocked) {
      toast.error("Điểm đã bị khóa");
      return;
    }

    const hasAnyGrade = Object.values(editingGrades).some(
      (grades) => Object.keys(grades).length > 0,
    );
    if (!hasAnyGrade) {
      toast.error("Vui lòng nhập ít nhất một điểm");
      return;
    }

    setSaving(true);
    try {
      const gradesData = Object.entries(editingGrades)
        .filter(([, gradeObj]) => Object.keys(gradeObj).length > 0)
        .map(([studentId, gradeObj]) => ({
          studentId,
          subjectId,
          classId: selectedClass,
          grades: Object.entries(gradeObj).map(([type, score]) => ({
            type,
            score,
          })),
        }));

      const res = await axiosInstance.post<{ success: boolean }>(
        "/grades/batch",
        {
          grades: gradesData,
        },
      );

      if (res.data?.success) {
        toast.success("✅ Lưu điểm thành công");
        setSubmitDialogOpen(true);
      }
    } catch (err: any) {
      console.error("handleSaveGrades error:", err);
      toast.error(err.response?.data?.message || "Lưu điểm thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitGrades = async () => {
    const subjectId = selectedSubject;
    if (!subjectId) {
      toast.error("Không tìm thấy môn học");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        classId: selectedClass,
        subjectId,
        grades: editingGrades,
        sendToStudents,
        sendToAdmin,
        teacherId: authUser?.teacherId,
      };

      const res = await axiosInstance.post<{
        success: boolean;
        message: string;
      }>("/grades/submit-with-notifications", payload);

      if (res.data?.success) {
        toast.success("✅ Điểm đã được gửi thành công!");
        setSubmitDialogOpen(false);
        setEditingGrades({});
      }
    } catch (err: any) {
      console.error("handleSubmitGrades error:", err);
      toast.error(err.response?.data?.message || "Gửi điểm thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentClassName =
    classes.find((c) => c._id === selectedClass)?.classCode || "";

  return (
    <div className="grade-entry-form">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Header */}
      <div className="form-header">
        <h1 className="title">📊 Nhập Điểm Học Sinh</h1>
        <p className="subtitle">Hệ thống quản lí điểm chuyên nghiệp</p>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-grid">
          <div className="filter-field">
            <label>Lớp dạy</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">-- Chọn lớp --</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.classCode}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Môn học</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                const subId = e.target.value;
                setSelectedSubject(subId);
                const subject = subjects.find((s) => s._id === subId);
                setSelectedSubjectName(subject?.name || "");
              }}
              disabled={subjects.length === 0}
            >
              <option value="">-- Chọn môn học --</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="grades-card">
        <div className="card-header">
          <h2 className="header-title">
            Danh Sách Điểm - {currentClassName} - {selectedSubjectName}
          </h2>
          <p className="header-subtitle">{validStudents.length} học sinh</p>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading-container">
              <CircularProgress />
            </div>
          ) : validStudents.length === 0 ? (
            <div className="alert info">
              <span>ℹ️</span>
              <span>
                {students.length > 0
                  ? `Tất cả ${students.length} học sinh đều có dữ liệu không đầy đủ. Vui lòng kiểm tra lại.`
                  : "Không có học sinh nào trong lớp"}
              </span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Mã SV</th>
                  <th>Tên Học Sinh</th>
                  {GRADE_TYPES.map((gt) => (
                    <th key={gt.key}>
                      <span className="grade-chip">{gt.short}</span>
                    </th>
                  ))}
                  <th>Tổng</th>
                  <th>%</th>
                  <th>Kết Quả</th>
                </tr>
              </thead>
              <tbody>
                {validStudents.map((student, idx) => {
                  const average = calculateAverage(student._id);
                  const result = getResult(average);
                  const percentage = Math.round(average * 10);

                  return (
                    <tr key={student._id}>
                      <td>{idx + 1}</td>
                      <td>{student.studentId}</td>
                      <td>{student.name}</td>

                      {GRADE_TYPES.map((gt) => (
                        <td key={gt.key} className="grade-cell">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={editingGrades[student._id]?.[gt.key] ?? ""}
                            onChange={(e) =>
                              handleGradeChange(
                                student._id,
                                gt.key,
                                e.target.value,
                              )
                            }
                            disabled={gradeLock?.isLocked}
                          />
                        </td>
                      ))}

                      <td className="summary-cell">
                        {average > 0 ? average.toFixed(1) : "-"}
                      </td>

                      <td className="summary-cell percentage">
                        {average > 0 ? `${percentage}%` : "-"}
                      </td>

                      <td className="summary-cell result">
                        <span
                          style={{
                            color: result === "Đạt" ? "#2e7d32" : "#c62828",
                            fontWeight: 600,
                          }}
                        >
                          {result}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Action Buttons */}
        {validStudents.length > 0 && (
          <div className="action-buttons">
            <button
              className="btn-outlined"
              onClick={handleSaveGrades}
              disabled={saving || gradeLock?.isLocked}
            >
              <SaveIcon />
              Lưu Điểm
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                handleSaveGrades();
                setTimeout(() => setSubmitDialogOpen(true), 500);
              }}
              disabled={saving || gradeLock?.isLocked}
            >
              <SendIcon />
              Lưu & Gửi
            </button>
          </div>
        )}
      </div>

      {/* Submit Dialog */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>📨 Gửi Thông Báo Điểm</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <p style={{ marginBottom: 16, color: "#ff9800", fontSize: 14 }}>
            ⚠️ Chọn người nhận được thông báo
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={sendToStudents}
                  onChange={(e) => setSendToStudents(e.target.checked)}
                />
              }
              label="📧 Gửi đến học sinh"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={sendToAdmin}
                  onChange={(e) => setSendToAdmin(e.target.checked)}
                />
              }
              label="📋 Gửi báo cáo đến quản trị viên"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleSubmitGrades}
            disabled={isSubmitting || (!sendToStudents && !sendToAdmin)}
          >
            {isSubmitting ? <CircularProgress size={20} /> : "✅ Gửi"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
