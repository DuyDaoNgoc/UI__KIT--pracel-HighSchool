import React, { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { ChevronDown } from "lucide-react";
import { io, type Socket } from "socket.io-client";

const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";
const getBackendURL = () => {
  if (typeof window === "undefined") return `http://localhost:${BACKEND_PORT}`;
  const hostname = window.location.hostname;
  const lanRegex = /^192\.168\.\d+\.\d+$/;
  if (hostname === "localhost") return `http://localhost:${BACKEND_PORT}`;
  if (lanRegex.test(hostname)) return `http://${hostname}:${BACKEND_PORT}`;
  return window.location.origin;
};

interface IAssignedClass {
  grade: string;
  classLetter: string;
  major: string;
  schoolYear: string;
  classCode: string;
  role?: string;
}

interface IStudent {
  _id: string;
  studentId: string;
  name: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  classCode?: string;
  schoolYear?: string;
}

interface Props {
  assignedClass?: IAssignedClass[];
  teacherName?: string;
}

export default function TeacherClasses({ assignedClass = [] }: Props) {
  const profileTeacherName = (arguments[0] as any)?.teacherName;

  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [studentsByClass, setStudentsByClass] = useState<
    Record<string, IStudent[]>
  >({});
  const [classMetaByCode, setClassMetaByCode] = useState<Record<string, any>>(
    {},
  );
  const [loadingStudents, setLoadingStudents] = useState<Set<string>>(
    new Set(),
  );
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);

  useEffect(() => {
    const newSocket = io(getBackendURL(), {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to Socket.io");
    });

    newSocket.on("student:created", (data) => {
      console.log("🔔 New student created via Socket:", data);
      if (data?.classCode) {
        setStudentsByClass((prev) => {
          const updated = { ...prev };
          delete updated[data.classCode];
          return updated;
        });
        // If class is currently expanded, refresh immediately
        if (data.classCode) fetchStudentsForClass(data.classCode);
      }
    });

    newSocket.on("student:updated", (data) => {
      console.log("🔔 Student updated via Socket:", data);
      if (data?.classCode) {
        setStudentsByClass((prev) => {
          const updated = { ...prev };
          delete updated[data.classCode];
          return updated;
        });
        // If class is currently expanded, refresh immediately
        if (data.classCode) fetchStudentsForClass(data.classCode);
      }
    });

    setSocket(newSocket);
    return () => {
      // ensure cleanup returns void (don't return value from close())
      try {
        newSocket.close();
      } catch (e) {
        console.warn("Socket close error during cleanup:", e);
      }
    };
  }, []);

  const roleLabel = (role?: string) => {
    if (!role) return "";
    const r = String(role).toLowerCase();
    if (r === "homeroom" || r === "chunhiem" || r === "chu-nhiem")
      return "Chủ nhiệm";
    if (
      r === "subject" ||
      r === "subjectteacher" ||
      r === "giáovienbomon" ||
      r === "giaovienbomon" ||
      r === "bomon"
    )
      return "Giáo viên bộ môn";
    return role;
  };

  const fetchStudentsForClass = async (classCode: string) => {
    setLoadingStudents((prev) => new Set([...prev, classCode]));
    try {
      const res = await axiosInstance.get<any>("/classes");
      const classes: any[] = res.data?.data || [];
      const cls = classes.find((c) => c.classCode === classCode);
      let classStudents: IStudent[] = (cls && cls.students) || [];
      classStudents = classStudents.filter(
        (s) => s.name && s.name !== "-" && s.studentId && s.studentId !== "-",
      );
      setStudentsByClass((prev) => ({ ...prev, [classCode]: classStudents }));
      setClassMetaByCode((prev) => ({
        ...prev,
        [classCode]: { teacherName: cls?.teacherName || "" },
      }));
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudentsByClass((prev) => ({ ...prev, [classCode]: [] }));
    } finally {
      setLoadingStudents((prev) => {
        const updated = new Set(prev);
        updated.delete(classCode);
        return updated;
      });
    }
  };

  const toggleClassExpand = (classCode: string) => {
    if (expandedClass === classCode) {
      setExpandedClass(null);
    } else {
      setExpandedClass(classCode);
      fetchStudentsForClass(classCode);
    }
  };

  return (
    <div className="profile__card">
      <h2>Lớp dạy</h2>
      {!assignedClass || assignedClass.length === 0 ? (
        <p>Không có lớp nào</p>
      ) : (
        <div className="classes-list">
          {assignedClass.map((cls, idx) => {
            const role = roleLabel(cls.role);
            const isExpanded = expandedClass === cls.classCode;
            const students = studentsByClass[cls.classCode] || [];
            const isLoading = loadingStudents.has(cls.classCode);

            return (
              <div key={idx} style={{ marginBottom: "1.5rem" }}>
                <div
                  onClick={() => toggleClassExpand(cls.classCode)}
                  style={{
                    padding: "1rem",
                    border: "1px solid #e0e0e0",
                    borderRadius: isExpanded ? "8px 8px 0 0" : "8px",
                    backgroundColor: "#f9f9f9",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 0.8rem 0", color: "#1976d2" }}>
                      {(() => {
                        const abbr = (cls.major || "")
                          .split(/\s+/)
                          .map((w) => (w[0] || "").toUpperCase())
                          .join("")
                          .slice(0, 10);
                        return `${cls.grade}${cls.classLetter}${abbr}`;
                      })()}
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.8rem",
                      }}
                    >
                      {(() => {
                        const metaName =
                          classMetaByCode[cls.classCode]?.teacherName;
                        const displayName = profileTeacherName || metaName;
                        return displayName ? (
                          <p style={{ margin: 0, gridColumn: "1 / -1" }}>
                            <b>Giáo viên:</b> {displayName}
                          </p>
                        ) : null;
                      })()}
                      <p style={{ margin: 0 }}>
                        <b>Năm học:</b> {cls.schoolYear}
                      </p>
                      {role && (
                        <p style={{ margin: 0, gridColumn: "1 / -1" }}>
                          <b>Chức vụ:</b>
                          <span
                            style={{
                              display: "inline-block",
                              marginLeft: "0.5rem",
                              padding: "0.3rem 0.8rem",
                              backgroundColor:
                                role === "Chủ nhiệm" ? "#4caf50" : "#2196f3",
                              color: "white",
                              borderRadius: "4px",
                              fontSize: "0.85rem",
                              fontWeight: 500,
                            }}
                          >
                            {role}
                          </span>
                        </p>
                      )}
                      <p
                        style={{
                          margin: 0,
                          gridColumn: "1 / -1",
                          fontSize: "0.85rem",
                          color: "#666",
                        }}
                      >
                        <b>Sĩ số:</b> {students.length} học sinh
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    size={24}
                    style={{
                      transition: "transform 0.3s ease",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      marginLeft: "1rem",
                      color: "#1976d2",
                      flexShrink: 0,
                    }}
                  />
                </div>

                {isExpanded && (
                  <div
                    style={{
                      border: "1px solid #e0e0e0",
                      borderTop: "none",
                      borderRadius: "0 0 8px 8px",
                      backgroundColor: "#fafafa",
                      padding: "1rem",
                    }}
                  >
                    <h4 style={{ margin: "0 0 1rem 0", color: "#333" }}>
                      Danh sách học sinh ({students.length})
                    </h4>
                    {isLoading ? (
                      <p style={{ textAlign: "center", color: "#999" }}>
                        Đang tải...
                      </p>
                    ) : students.length === 0 ? (
                      <p style={{ textAlign: "center", color: "#999" }}>
                        Chưa có học sinh
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(250px, 1fr))",
                          gap: "0.8rem",
                        }}
                      >
                        {students.map((student) => (
                          <div
                            key={student._id}
                            style={{
                              padding: "0.8rem",
                              backgroundColor: "white",
                              border: "1px solid #ddd",
                              borderRadius: "6px",
                              fontSize: "0.9rem",
                            }}
                            onClick={() => setSelectedStudent(student)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ")
                                setSelectedStudent(student);
                            }}
                          >
                            <p
                              style={{
                                margin: "0 0 0.3rem 0",
                                fontWeight: 500,
                              }}
                            >
                              {student.name}
                            </p>
                            <p style={{ margin: "0.2rem 0", color: "#666" }}>
                              <b>Mã HS:</b> {student.studentId}
                            </p>
                            {student.email && (
                              <p style={{ margin: "0.2rem 0", color: "#666" }}>
                                <b>Email:</b> {student.email}
                              </p>
                            )}
                            {student.phone && (
                              <p style={{ margin: "0.2rem 0", color: "#666" }}>
                                <b>SĐT:</b> {student.phone}
                              </p>
                            )}
                            {student.dob && (
                              <p style={{ margin: "0.2rem 0", color: "#666" }}>
                                <b>Năm sinh:</b>{" "}
                                {(() => {
                                  try {
                                    return new Date(student.dob).getFullYear();
                                  } catch {
                                    return student.dob;
                                  }
                                })()}
                              </p>
                            )}
                            {student.schoolYear && (
                              <p style={{ margin: "0.2rem 0", color: "#666" }}>
                                <b>Niên khoá:</b> {student.schoolYear}
                              </p>
                            )}
                            {student.gender && (
                              <p style={{ margin: "0.2rem 0", color: "#666" }}>
                                <b>Giới tính:</b> {student.gender}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedStudent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "1rem",
          }}
          onClick={() => setSelectedStudent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              background: "#fff",
              borderRadius: 8,
              padding: "1.2rem",
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>{selectedStudent.name}</h3>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                }}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div
              style={{ marginTop: "0.8rem", display: "grid", gap: "0.6rem" }}
            >
              <p style={{ margin: 0 }}>
                <b>Mã HS:</b> {selectedStudent.studentId}
              </p>
              {selectedStudent.email && (
                <p style={{ margin: 0 }}>
                  <b>Email:</b> {selectedStudent.email}
                </p>
              )}
              {selectedStudent.phone && (
                <p style={{ margin: 0 }}>
                  <b>SĐT:</b> {selectedStudent.phone}
                </p>
              )}
              {selectedStudent.dob && (
                <p style={{ margin: 0 }}>
                  <b>Ngày sinh:</b>{" "}
                  {new Date(selectedStudent.dob).toLocaleDateString()}
                </p>
              )}
              {selectedStudent.gender && (
                <p style={{ margin: 0 }}>
                  <b>Giới tính:</b> {selectedStudent.gender}
                </p>
              )}
              {selectedStudent.schoolYear && (
                <p style={{ margin: 0 }}>
                  <b>Niên khoá:</b> {selectedStudent.schoolYear}
                </p>
              )}

              <div
                style={{ marginTop: "0.6rem", display: "flex", gap: "0.6rem" }}
              >
                <button
                  onClick={() => setSelectedStudent(null)}
                  style={{
                    padding: "0.5rem 0.8rem",
                    background: "#eee",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
