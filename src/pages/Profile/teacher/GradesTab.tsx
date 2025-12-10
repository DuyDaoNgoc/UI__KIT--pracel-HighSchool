import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../api/axiosConfig";

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
        const url = classId
          ? `/api/classes/${classId}/students`
          : "/api/students";
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
    <div className="profile__card">
      <h2 className="profile__title">Nhập điểm</h2>

      {/* Chọn môn học */}
      <div className="form-group mb-3">
        <label>Chọn môn học:</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          disabled={gradeLock?.isLocked}
        >
          <option value="">-- Chọn môn học --</option>
          {subjects.map((subject) => (
            <option key={subject._id} value={subject._id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* Cảnh báo khóa điểm */}
      {gradeLock?.isLocked && (
        <div className="alert alert-warning">
          ⚠️ Điểm của môn học "<strong>{currentSubjectName}</strong>" đã bị khóa
          bởi Admin. Không thể chỉnh sửa hoặc lưu điểm.
        </div>
      )}

      {/* Danh sách nhập điểm */}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : students.length === 0 ? (
        <p className="no-data">Chưa có học sinh nào.</p>
      ) : (
        <>
          <table className="grades-table">
            <thead>
              <tr>
                <th>Mã HS</th>
                <th>Tên học sinh</th>
                <th>Điểm ({currentSubjectName})</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td>{student.studentId}</td>
                  <td>{student.name}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={editingGrades[student._id] || ""}
                      onChange={(e) =>
                        handleGradeChange(
                          student._id,
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      disabled={gradeLock?.isLocked}
                      placeholder="Nhập điểm"
                      className="grade-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="action-buttons">
            <button
              onClick={handleSaveGrades}
              disabled={saving || gradeLock?.isLocked}
              className="button success"
            >
              {saving ? "Đang lưu..." : "Lưu điểm"}
            </button>
          </div>
        </>
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
