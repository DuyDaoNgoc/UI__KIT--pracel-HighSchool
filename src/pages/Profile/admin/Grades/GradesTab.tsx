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
  const GRADE_TYPES = [
    { key: "oral", label: "Miệng", short: "M" },
    { key: "test15", label: "15 phút", short: "15p" },
    { key: "test1period", label: "1 tiết", short: "1t" },
    { key: "midterm", label: "Giữa kì", short: "GK" },
    { key: "semester1", label: "HK 1", short: "HK1" },
    { key: "semester2", label: "HK 2", short: "HK2" },
    { key: "final", label: "Cuối kì", short: "CK" },
  ];

  const [editGradesMap, setEditGradesMap] = useState<
    Record<string, Record<string, number>>
  >({});
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<
    Array<{ _id: string; classCode?: string; className?: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(0);

  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [gradesRes, studentsRes, subjectsRes, classesRes] =
          await Promise.all([
            axiosInstance.get<{ data: Grade[] }>("/grades"),
            axiosInstance.get<{ data: Student[] }>("/students"),
            axiosInstance.get<{ data: Subject[] }>("/subjects"),
            axiosInstance.get<{
              data: { _id: string; classCode?: string; className?: string }[];
            }>("/classes"),
          ]);

        setGrades(gradesRes.data?.data || []);
        setStudents(studentsRes.data?.data || []);
        setSubjects(subjectsRes.data?.data || []);
        setClasses(classesRes.data?.data || []);
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

  const getStudentName = (studentId: string | any) => {
    if (!studentId) return "Không xác định";
    // If populated object
    if (typeof studentId === "object") {
      return studentId.name || studentId.studentName || "Không xác định";
    }
    const student = students.find((s) => String(s._id) === String(studentId));
    return student?.name || "Không xác định";
  };

  const getStudentCode = (studentId: string | any) => {
    if (!studentId) return "";
    if (typeof studentId === "object") {
      return (
        studentId.studentId || studentId.code || studentId.studentCode || ""
      );
    }
    // try lookup
    const student = students.find(
      (s) =>
        String(s._id) === String(studentId) ||
        String(s.studentId) === String(studentId),
    );
    return student?.studentId || "";
  };

  const getSubjectName = (subjectId: string | any) => {
    if (!subjectId) return "Không xác định";
    if (typeof subjectId === "object") {
      return subjectId.name || subjectId.subjectName || "Không xác định";
    }
    const subject = subjects.find((s) => String(s._id) === String(subjectId));
    return subject?.name || "Không xác định";
  };

  const getClassName = (classId: string | any) => {
    if (!classId) return "Không xác định";
    if (typeof classId === "object") {
      return classId.classCode || classId.className || "Không xác định";
    }
    const cls = classes.find(
      (c) =>
        String(c._id) === String(classId) ||
        String(c.classCode) === String(classId),
    );
    return cls?.classCode || cls?.className || "Không xác định";
  };

  const filteredGrades = grades.filter((g) => {
    const studentName = getStudentName(g.studentId).toLowerCase();
    const subjectName = getSubjectName(g.subjectId).toLowerCase();
    const matchSearch =
      studentName.includes(search.toLowerCase()) ||
      subjectName.includes(search.toLowerCase());
    const gSubjectId =
      typeof g.subjectId === "object"
        ? g.subjectId._id || g.subjectId
        : g.subjectId;
    const matchSubject =
      filterSubject === "all" || String(gSubjectId) === String(filterSubject);
    const gClassId =
      typeof g.classId === "object" ? g.classId._id || g.classId : g.classId;
    const matchClass =
      filterClass === "all" || String(gClassId) === String(filterClass);
    return matchSearch && matchSubject && matchClass;
  });

  const handleEditScore = async (gradeId: string) => {
    // Legacy single-score update kept for compatibility when grade document uses `score`.
    try {
      const res = await axiosInstance.put<{ grade: Grade }>(
        `/grades/${gradeId}`,
        { score: editScore },
      );
      if (res.data?.grade) {
        setGrades((prev) =>
          prev.map((g) => (g._id === gradeId ? res.data.grade : g)),
        );
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

  const handleStartEdit = (grade: Grade) => {
    setEditingGrade(grade._id);
    // initialize edit map for this grade from grade.grades or fallback to score
    const map: Record<string, number> = {};
    // grade may contain `grades` array or legacy `score` field
    if ((grade as any).grades && Array.isArray((grade as any).grades)) {
      for (const g of (grade as any).grades) {
        if (g && g.type) map[g.type] = Number(g.score || 0);
      }
    } else if ((grade as any).score !== undefined) {
      // place legacy score into `final`
      map["final"] = Number((grade as any).score);
    }
    setEditGradesMap((prev) => ({ ...prev, [grade._id]: map }));
  };

  const handleGradeTypeChange = (
    gradeId: string,
    type: string,
    value: string,
  ) => {
    const num = value === "" ? NaN : parseFloat(value);
    setEditGradesMap((prev) => {
      const copy = { ...(prev || {}) };
      copy[gradeId] = { ...(copy[gradeId] || {}) };
      if (isNaN(num)) delete copy[gradeId][type];
      else copy[gradeId][type] = num;
      return copy;
    });
  };

  const handleSaveGradeTypes = async (gradeId: string) => {
    try {
      const gradeMap = editGradesMap[gradeId] || {};
      const gradesArray = Object.entries(gradeMap).map(([type, score]) => ({
        type,
        score,
      }));
      const res = await axiosInstance.put<{ grade: Grade }>(
        `/grades/${gradeId}`,
        { grades: gradesArray },
      );
      if (res.data?.grade) {
        setGrades((prev) =>
          prev.map((g) => (g._id === gradeId ? res.data.grade : g)),
        );
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
      console.error("handleSaveGradeTypes error:", err);
      toast.error(err?.response?.data?.message || "Lưu điểm thất bại");
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
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="filter-select"
            style={{ marginLeft: 8 }}
          >
            <option value="all">Tất cả lớp</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.classCode || c.className || c._id}
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
              <th>Mã SV</th>
              <th>Học sinh</th>
              <th>Lớp</th>
              <th>Môn học</th>
              {GRADE_TYPES.map((gt) => (
                <th key={gt.key}>{gt.short}</th>
              ))}
              <th>Tổng</th>
              <th>%</th>
              <th>Kết Quả</th>
              <th>Ngày</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrades.map((grade) => (
              <tr key={grade._id}>
                <td style={{ whiteSpace: "nowrap" }}>
                  {getStudentCode(grade.studentId)}
                </td>
                <td>{getStudentName(grade.studentId)}</td>
                <td>{getClassName(grade.classId)}</td>
                <td>{getSubjectName(grade.subjectId)}</td>
                {GRADE_TYPES.map((gt) => {
                  const currentVal =
                    editingGrade === grade._id
                      ? (editGradesMap[grade._id]?.[gt.key] ?? "")
                      : (grade as any).grades &&
                          Array.isArray((grade as any).grades)
                        ? ((grade as any).grades.find(
                            (x: any) => x.type === gt.key,
                          )?.score ?? "")
                        : "";
                  return (
                    <td key={gt.key} style={{ textAlign: "center" }}>
                      {editingGrade === grade._id ? (
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={currentVal}
                          onChange={(e) =>
                            handleGradeTypeChange(
                              grade._id,
                              gt.key,
                              e.target.value,
                            )
                          }
                          className="grade-input"
                          style={{ width: 56 }}
                        />
                      ) : (
                        <span className="grade-value">
                          {currentVal !== "" ? `${currentVal}` : "-"}
                        </span>
                      )}
                    </td>
                  );
                })}

                {/* Tổng, % và Kết quả */}
                <td style={{ textAlign: "center", fontWeight: 600 }}>
                  {(() => {
                    // compute average
                    const avg = (() => {
                      if (
                        editingGrade === grade._id &&
                        editGradesMap[grade._id]
                      ) {
                        const vals = Object.values(
                          editGradesMap[grade._id],
                        ).filter((n) => typeof n === "number" && !isNaN(n));
                        if (vals.length === 0) return null;
                        return (
                          Math.round(
                            (vals.reduce((a, b) => a + b, 0) / vals.length) *
                              10,
                          ) / 10
                        );
                      }
                      if ((grade as any).averageScore !== undefined)
                        return (grade as any).averageScore;
                      if (
                        (grade as any).grades &&
                        Array.isArray((grade as any).grades)
                      ) {
                        const vals = (grade as any).grades
                          .map((x: any) => Number(x.score))
                          .filter((n: any) => !isNaN(n));
                        if (vals.length === 0) return null;
                        return (
                          Math.round(
                            (vals.reduce((a: number, b: number) => a + b, 0) /
                              vals.length) *
                              10,
                          ) / 10
                        );
                      }
                      if ((grade as any).score !== undefined)
                        return (grade as any).score;
                      return null;
                    })();
                    return avg !== null ? `${avg}` : "-";
                  })()}
                </td>
                <td style={{ textAlign: "center" }}>
                  {(() => {
                    const avg = (() => {
                      if (
                        editingGrade === grade._id &&
                        editGradesMap[grade._id]
                      ) {
                        const vals = Object.values(
                          editGradesMap[grade._id],
                        ).filter((n) => typeof n === "number" && !isNaN(n));
                        if (vals.length === 0) return null;
                        return (
                          Math.round(
                            (vals.reduce((a, b) => a + b, 0) / vals.length) *
                              10,
                          ) / 10
                        );
                      }
                      if ((grade as any).averageScore !== undefined)
                        return (grade as any).averageScore;
                      if (
                        (grade as any).grades &&
                        Array.isArray((grade as any).grades)
                      ) {
                        const vals = (grade as any).grades
                          .map((x: any) => Number(x.score))
                          .filter((n: any) => !isNaN(n));
                        if (vals.length === 0) return null;
                        return (
                          Math.round(
                            (vals.reduce((a: number, b: number) => a + b, 0) /
                              vals.length) *
                              10,
                          ) / 10
                        );
                      }
                      if ((grade as any).score !== undefined)
                        return (grade as any).score;
                      return null;
                    })();
                    return avg !== null ? `${Math.round(avg * 10)}%` : "-";
                  })()}
                </td>
                <td style={{ textAlign: "center" }}>
                  {(() => {
                    const avg = (() => {
                      if (
                        editingGrade === grade._id &&
                        editGradesMap[grade._id]
                      ) {
                        const vals = Object.values(
                          editGradesMap[grade._id],
                        ).filter((n) => typeof n === "number" && !isNaN(n));
                        if (vals.length === 0) return null;
                        return (
                          Math.round(
                            (vals.reduce((a, b) => a + b, 0) / vals.length) *
                              10,
                          ) / 10
                        );
                      }
                      if ((grade as any).averageScore !== undefined)
                        return (grade as any).averageScore;
                      if (
                        (grade as any).grades &&
                        Array.isArray((grade as any).grades)
                      ) {
                        const vals = (grade as any).grades
                          .map((x: any) => Number(x.score))
                          .filter((n: any) => !isNaN(n));
                        if (vals.length === 0) return null;
                        return (
                          Math.round(
                            (vals.reduce((a: number, b: number) => a + b, 0) /
                              vals.length) *
                              10,
                          ) / 10
                        );
                      }
                      if ((grade as any).score !== undefined)
                        return (grade as any).score;
                      return null;
                    })();
                    if (avg === null) return "-";
                    return avg >= 5 ? (
                      <span style={{ color: "#2e7d32", fontWeight: 600 }}>
                        Đạt
                      </span>
                    ) : (
                      <span style={{ color: "#c62828", fontWeight: 600 }}>
                        Không đạt
                      </span>
                    );
                  })()}
                </td>
                <td>
                  {new Date(grade.createdAt || "").toLocaleDateString("vi-VN")}
                </td>
                <td>
                  {editingGrade === grade._id ? (
                    <>
                      <button
                        onClick={() => handleSaveGradeTypes(grade._id)}
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
                      onClick={() => handleStartEdit(grade)}
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
