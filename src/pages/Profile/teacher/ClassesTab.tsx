import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../api/axiosConfig";

interface Class {
  _id: string;
  classCode: string;
  teacherName?: string;
  grade: string;
  classLetter: string;
  students: any[];
}

interface Student {
  _id: string;
  studentId: string;
  name: string;
  dob?: string;
  address?: string;
}

export default function TeacherClassesTab() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<{ [key: string]: Student[] }>({});
  const [loading, setLoading] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get<{ data: Class[] }>("/classes");
        setClasses(res.data?.data || []);
      } catch (err) {
        console.error("fetchClasses error:", err);
        toast.error("Lỗi tải danh sách lớp");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleExpandClass = async (classId: string) => {
    if (expandedClass === classId) {
      setExpandedClass(null);
      return;
    }

    if (!students[classId]) {
      try {
        const res = await axiosInstance.get<{ data: Student[] }>(
          `/classes/${classId}/students`,
        );
        setStudents((prev) => ({
          ...prev,
          [classId]: res.data?.data || [],
        }));
      } catch (err) {
        console.error("fetchStudents error:", err);
        toast.error("Lỗi tải danh sách học sinh");
        return;
      }
    }

    setExpandedClass(classId);
  };

  const formatDate = (dob?: string) =>
    dob ? new Date(dob).toLocaleDateString("vi-VN") : "-";

  return (
    <div className="profile__card">
      <h2 className="profile__title">Quản lý lớp phụ trách</h2>

      {loading ? (
        <p>Đang tải lớp...</p>
      ) : classes.length === 0 ? (
        <p className="no-data">Chưa có lớp nào được giao phó.</p>
      ) : (
        <div className="classes-list">
          {classes.map((cls) => (
            <div key={cls._id} className="class-section">
              <button
                onClick={() => handleExpandClass(cls._id)}
                className="class-header"
              >
                <span className="class-code">{cls.classCode}</span>
                <span className="class-info">
                  Khối {cls.grade} - Lớp {cls.classLetter}
                </span>
                <span className="student-count">
                  ({cls.students?.length || 0} HS)
                </span>
                <span
                  className={`toggle-icon ${expandedClass === cls._id ? "open" : ""}`}
                >
                  ▼
                </span>
              </button>

              {expandedClass === cls._id && (
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Mã HS</th>
                      <th>Tên</th>
                      <th>Ngày sinh</th>
                      <th>Địa chỉ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(students[cls._id] || []).map((student) => (
                      <tr key={student._id}>
                        <td>{student.studentId}</td>
                        <td>{student.name}</td>
                        <td>{formatDate(student.dob)}</td>
                        <td>{student.address || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
