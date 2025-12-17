import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../../api/axiosConfig";

interface Grade {
  _id: string;
  studentId: string;
  subjectId: string;
  score: number;
  createdAt?: string;
  updatedAt?: string;
  studentName?: string;
  subjectName?: string;
}

interface Student {
  _id: string;
  studentId: string;
  name: string;
}

interface Subject {
  _id: string;
  name: string;
}

export default function GradesTab() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(0);

  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [gradesRes, studentsRes, subjectsRes] = await Promise.all([
          axiosInstance.get<{ data: Grade[] }>("/grades"),
          axiosInstance.get<{ data: Student[] }>("/students"),
          axiosInstance.get<{ data: Subject[] }>("/subjects"),
        ]);

        setGrades(gradesRes.data?.data || []);
        setStudents(studentsRes.data?.data || []);
        setSubjects(subjectsRes.data?.data || []);
      } catch (err) {
        console.error("fetchData error:", err);
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Listen for grade updates from teacher
    const handleGradeUpdate = (e: any) => {
      console.log("📝 [GradesTab] Received grade:updated event, refreshing...");
      fetchData();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "grade:updated" && e.newValue) {
        console.log("📝 [GradesTab] Detected grade:updated via storage");
        fetchData();
      }
    };

    // Polling for grade updates (every 2 seconds)
    let lastGradeUpdate = localStorage.getItem("grade:updated");
    const pollInterval = setInterval(() => {
      const currentGradeUpdate = localStorage.getItem("grade:updated");
      if (currentGradeUpdate && currentGradeUpdate !== lastGradeUpdate) {
        console.log("📝 [GradesTab] Detected grade:updated via polling");
        lastGradeUpdate = currentGradeUpdate;
        fetchData();
      }
    }, 2000);

    window.addEventListener("grade:updated", handleGradeUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("grade:updated", handleGradeUpdate);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s._id === studentId);
    return student?.name || "Không xác định";
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s._id === subjectId);
    return subject?.name || "Không xác định";
  };

  const filteredGrades = grades.filter((g) => {
    const matchSearch =
      getStudentName(g.studentId)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      getSubjectName(g.subjectId).toLowerCase().includes(search.toLowerCase());
    const matchSubject =
      filterSubject === "all" || g.subjectId === filterSubject;
    return matchSearch && matchSubject;
  });

  const handleEditScore = async (gradeId: string) => {
    try {
      const res = await axiosInstance.put<{ grade: Grade }>(
        `/grades/${gradeId}`,
        { score: editScore },
      );
      if (res.data?.grade) {
        setGrades((prev) =>
          prev.map((g) => (g._id === gradeId ? res.data.grade : g)),
        );

        // Dispatch event for sync
        try {
          localStorage.setItem("grade:updated", JSON.stringify(res.data.grade));
          window.dispatchEvent(
            new CustomEvent("grade:updated", { detail: res.data.grade }),
          );
        } catch (e) {
          console.error("Failed to dispatch grade update event:", e);
        }

        setEditingGrade(null);
        toast.success("Cập nhật điểm thành công");
      }
    } catch (err: any) {
      console.error("handleEditScore error:", err);
      toast.error("Cập nhật điểm thất bại");
    }
  };

  return (
    <div className="profile__card">
      <h2 className="profile__title">Quản lý điểm</h2>

      {/* Bộ lọc */}
      <div className="filter-bar mb-2">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm học sinh, môn học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-buttons">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả môn học</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Danh sách điểm */}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : filteredGrades.length === 0 ? (
        <p className="no-data">Chưa có dữ liệu điểm nào.</p>
      ) : (
        <table className="profile__table">
          <thead>
            <tr>
              <th>Học sinh</th>
              <th>Môn học</th>
              <th>Điểm</th>
              <th>Ngày</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrades.map((grade) => (
              <tr key={grade._id}>
                <td>{getStudentName(grade.studentId)}</td>
                <td>{getSubjectName(grade.subjectId)}</td>
                <td>
                  {editingGrade === grade._id ? (
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={editScore}
                      onChange={(e) =>
                        setEditScore(parseFloat(e.target.value) || 0)
                      }
                      className="grade-input"
                      style={{
                        width: "60px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid #d1d5db",
                      }}
                    />
                  ) : (
                    <span className="grade-value">{grade.score}/10</span>
                  )}
                </td>
                <td>
                  {new Date(grade.createdAt || "").toLocaleDateString("vi-VN")}
                </td>
                <td>
                  {editingGrade === grade._id ? (
                    <>
                      <button
                        onClick={() => handleEditScore(grade._id)}
                        className="action-btn success"
                        style={{ marginRight: "4px" }}
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingGrade(null)}
                        className="action-btn warning"
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingGrade(grade._id);
                        setEditScore(grade.score);
                      }}
                      className="action-btn primary"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
