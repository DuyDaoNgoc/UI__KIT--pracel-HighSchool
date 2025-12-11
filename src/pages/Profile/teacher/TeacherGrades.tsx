import React, { useState } from "react";
import { get, post } from "../../../api/axiosConfig";

interface IClass {
  _id: string;
  className?: string;
  classCode: string;
  grade: string;
  classLetter: string;
  schoolYear: string;
  studentIds?: string[];
}

interface IStudent {
  _id: string;
  studentId: string;
  username: string;
  email: string;
  grades?: Array<{ subject: string; score: number }>;
}

interface ISubjectTeacher {
  subject: string;
  teacherId: string;
  teacherName: string;
}

interface Props {
  classes?: IClass[];
  teacherId?: string;
}

interface GradeEntry {
  studentId: string;
  studentName: string;
  subject: string;
  score: number;
}

export default function TeacherGrades({ classes = [], teacherId }: Props) {
  const [view, setView] = useState<"select" | "entry">("select");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [students, setStudents] = useState<IStudent[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<ISubjectTeacher[]>([]);
  const [gradeEntries, setGradeEntries] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submitted, setSubmitted] = useState<GradeEntry[]>([]);

  const handleClassSelect = async (classId: string) => {
    if (!classId) return;

    setLoading(true);
    setMessage(null);
    try {
      const classData = classes.find((c) => c._id === classId);
      if (!classData) throw new Error("Lớp không tìm thấy");

      // Fetch students and subject teachers in class
      const studentsRes = await get<{
        students: IStudent[];
        subjectTeachers: ISubjectTeacher[];
      }>(`/grades/class/${classId}`);

      setStudents(studentsRes?.students || []);

      // Filter subject teachers for this teacher
      const allSubjectTeachers = studentsRes?.subjectTeachers || [];
      const mySubjects = allSubjectTeachers.filter(
        (st: ISubjectTeacher) => st.teacherId === teacherId,
      );

      if (mySubjects.length === 0) {
        setMessage({
          type: "error",
          text: "Bạn không dạy môn nào trong lớp này",
        });
        setTeacherSubjects([]);
      } else {
        setTeacherSubjects(mySubjects);
      }

      setSelectedClass(classId);
      setSelectedSubject("");
      setGradeEntries({});
      setView("entry");
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi tải dữ liệu lớp",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId: string, score: string) => {
    const scoreNum = parseFloat(score);
    if (score === "") {
      setGradeEntries((prev) => {
        const newEntries = { ...prev };
        delete newEntries[studentId];
        return newEntries;
      });
    } else if (!isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 10) {
      setGradeEntries((prev) => ({
        ...prev,
        [studentId]: scoreNum,
      }));
    }
  };

  const handleSubmitGrades = async () => {
    if (!selectedSubject || Object.keys(gradeEntries).length === 0) {
      setMessage({
        type: "error",
        text: "Vui lòng chọn môn học và nhập ít nhất một điểm",
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const updates = Object.entries(gradeEntries).map(
        ([studentId, score]) => ({
          studentId,
          subject: selectedSubject,
          grade: score,
        }),
      );

      const results = await Promise.allSettled(
        updates.map((update) => post(`/grades/request-update`, update)),
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      const success = results.filter((r) => r.status === "fulfilled").length;

      const successEntries = Object.entries(gradeEntries).map(
        ([studentId, score]) => ({
          studentId,
          studentName:
            students.find((s) => s._id === studentId)?.username || "Unknown",
          subject: selectedSubject,
          score,
        }),
      );

      setSubmitted((prev) => [...prev, ...successEntries]);
      setMessage({
        type: failed === 0 ? "success" : "error",
        text: `Đã cập nhật ${success} điểm${failed > 0 ? `, ${failed} lỗi` : ""}`,
      });

      if (failed === 0) {
        setSelectedSubject("");
        setGradeEntries({});
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Lỗi gửi điểm",
      });
    } finally {
      setLoading(false);
    }
  };

  const classData = classes.find((c) => c._id === selectedClass);

  return (
    <div className="profile__card">
      <h2>Nhập điểm cho học sinh</h2>

      {message && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1.5rem",
            borderRadius: "8px",
            backgroundColor: message.type === "success" ? "#d4edda" : "#f8d7da",
            color: message.type === "success" ? "#155724" : "#721c24",
            border: `1px solid ${message.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
          }}
        >
          {message.text}
        </div>
      )}

      {view === "select" && (
        <div>
          <p style={{ marginBottom: "1rem", color: "#666" }}>
            Chọn lớp để nhập điểm cho học sinh:
          </p>
          {classes.length === 0 ? (
            <p
              style={{ color: "#999", padding: "1.5rem", textAlign: "center" }}
            >
              Không có lớp nào để quản lý
            </p>
          ) : (
            <div style={{ display: "grid", gap: "0.8rem" }}>
              {classes.map((cls) => (
                <button
                  key={cls._id}
                  onClick={() => handleClassSelect(cls._id)}
                  disabled={loading}
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    backgroundColor: "#f9f9f9",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading)
                      (
                        e.currentTarget as HTMLButtonElement
                      ).style.backgroundColor = "#f0f0f0";
                  }}
                  onMouseLeave={(e) => {
                    (
                      e.currentTarget as HTMLButtonElement
                    ).style.backgroundColor = "#f9f9f9";
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "0.3rem" }}>
                    {cls.classCode || cls.className}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>
                    Khối {cls.grade} | {cls.studentIds?.length || 0} học sinh |{" "}
                    {cls.schoolYear}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "entry" && (
        <div>
          {/* Header with back button and class info */}
          <div
            style={{
              marginBottom: "1.5rem",
              paddingBottom: "1rem",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <button
                onClick={() => {
                  setView("select");
                  setSelectedClass("");
                  setStudents([]);
                  setTeacherSubjects([]);
                  setGradeEntries({});
                }}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginBottom: "0.5rem",
                }}
              >
                ← Quay lại
              </button>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  marginTop: "0.5rem",
                }}
              >
                {classData?.classCode || "Lớp"}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                {students.length} học sinh
              </div>
            </div>
          </div>

          {/* Subject selection */}
          {teacherSubjects.length > 0 ? (
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Chọn môn học dạy trong lớp này:
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setGradeEntries({});
                }}
                style={{
                  width: "100%",
                  padding: "0.7rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem",
                }}
              >
                <option value="">-- Chọn môn học --</option>
                {teacherSubjects.map((subject) => (
                  <option key={subject.subject} value={subject.subject}>
                    {subject.subject}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div
              style={{
                padding: "1rem",
                marginBottom: "1.5rem",
                backgroundColor: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "4px",
                color: "#856404",
              }}
            >
              Bạn không dạy môn nào trong lớp này
            </div>
          )}

          {selectedSubject && (
            <div>
              {/* Grade entry table */}
              <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.95rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#f5f5f5",
                        borderBottom: "2px solid #ddd",
                      }}
                    >
                      <th
                        style={{
                          padding: "0.8rem",
                          textAlign: "left",
                          fontWeight: "bold",
                        }}
                      >
                        Học sinh
                      </th>
                      <th
                        style={{
                          padding: "0.8rem",
                          textAlign: "center",
                          fontWeight: "bold",
                          minWidth: "100px",
                        }}
                      >
                        Điểm {selectedSubject}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => (
                      <tr
                        key={student._id}
                        style={{
                          borderBottom: "1px solid #eee",
                          backgroundColor: idx % 2 === 0 ? "#fafafa" : "white",
                        }}
                      >
                        <td style={{ padding: "0.8rem" }}>
                          <div style={{ fontWeight: "500" }}>
                            {student.username}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "#999" }}>
                            {student.studentId}
                          </div>
                        </td>
                        <td style={{ padding: "0.8rem", textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={gradeEntries[student._id] ?? ""}
                            onChange={(e) =>
                              handleGradeChange(student._id, e.target.value)
                            }
                            style={{
                              width: "100%",
                              maxWidth: "80px",
                              padding: "0.6rem",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              textAlign: "center",
                              fontSize: "1rem",
                            }}
                            placeholder="—"
                            disabled={loading}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action buttons */}
              <div
                style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}
              >
                <button
                  onClick={handleSubmitGrades}
                  disabled={loading || Object.keys(gradeEntries).length === 0}
                  style={{
                    padding: "0.8rem 1.5rem",
                    backgroundColor:
                      loading || Object.keys(gradeEntries).length === 0
                        ? "#ccc"
                        : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor:
                      loading || Object.keys(gradeEntries).length === 0
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: "bold",
                    fontSize: "1rem",
                  }}
                >
                  {loading ? "Đang gửi..." : "Gửi điểm"}
                </button>
                <button
                  onClick={() => {
                    setSelectedSubject("");
                    setGradeEntries({});
                  }}
                  disabled={loading}
                  style={{
                    padding: "0.8rem 1.5rem",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Xóa
                </button>
              </div>

              {/* Success history */}
              {submitted.length > 0 && (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#f0f8ff",
                    borderLeft: "4px solid #0066cc",
                    borderRadius: "4px",
                  }}
                >
                  <h4
                    style={{
                      marginTop: 0,
                      marginBottom: "0.8rem",
                      color: "#0066cc",
                    }}
                  >
                    Đã gửi ({submitted.length}):
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                    {submitted.map((entry, idx) => (
                      <li
                        key={idx}
                        style={{ fontSize: "0.9rem", marginBottom: "0.3rem" }}
                      >
                        <strong>{entry.studentName}</strong> ({entry.subject}):{" "}
                        <strong>{entry.score}</strong>/10
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
