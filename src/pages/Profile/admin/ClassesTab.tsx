// src/pages/Profile/admin/ClassesTab.tsx
import React, { useState, useEffect } from "react";
import { ICreatedStudent } from "../../../types/student";
import axiosInstance from "../../../api/axiosConfig";

interface ClassesTabProps {
  students: ICreatedStudent[];
}

interface ClassData {
  students: ICreatedStudent[];
  teacherName?: string;
  classCode: string;
}

export default function ClassesTab({ students }: ClassesTabProps) {
  const [openClassKey, setOpenClassKey] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<ICreatedStudent | null>(null);
  const [studentList, setStudentList] = useState<ICreatedStudent[]>([]);

  // ===== Cập nhật danh sách students từ props =====
  useEffect(() => {
    setStudentList(students);
  }, [students]);

  // ===== Đồng bộ học sinh lên MongoDB classes =====
  useEffect(() => {
    const syncStudentsToClasses = async () => {
      for (const s of studentList) {
        if (!s.grade || !s.classLetter || !s.major || !s._id) continue;

        try {
          await axiosInstance.post("/api/admin/classes/add-student", {
            studentId: s._id,
            grade: s.grade,
            classLetter: s.classLetter,
            major: s.major,
          });
        } catch (err) {
          console.error("⚠️ sync student to class error:", err);
        }
      }
    };

    if (studentList.length > 0) syncStudentsToClasses();
  }, [studentList]);

  // ===== Gom nhóm theo ngành → trong ngành theo khối (grade) → trong khối theo lớp =====
  const groupedByMajor = studentList.reduce<
    Record<string, Record<string, Record<string, ClassData>>>
  >((acc, s) => {
    const major = s.major || "Chưa có ngành";
    const grade = s.grade?.toString() || "Chưa rõ khối";

    if (!acc[major]) acc[major] = {};
    if (!acc[major][grade]) acc[major][grade] = {};

    const majorAbbrev = major
      .split(/\s+/)
      .map((w: string) => (w ? w[0].toUpperCase() : ""))
      .join("");
    const code =
      s.classCode || `${s.grade || "X"}${s.classLetter || "X"}${majorAbbrev}`;

    if (!acc[major][grade][code]) {
      acc[major][grade][code] = {
        students: [],
        teacherName: s.teacherName,
        classCode: code,
      };
    }
    acc[major][grade][code].students.push(s);

    return acc;
  }, {});

  const toggleClass = (key: string) => {
    setOpenClassKey(openClassKey === key ? null : key);
    setSelectedStudent(null);
  };

  const formatDate = (dob?: string) => {
    if (!dob) return "-";
    const d = new Date(dob);
    return d.toLocaleDateString("vi-VN");
  };

  return (
    <div className="profile__card">
      <h2 className="profile__title">Quản lý lớp</h2>

      {studentList.length === 0 ? (
        <p className="no-class">Chưa có lớp nào.</p>
      ) : (
        Object.entries(groupedByMajor).map(([major, grades]) => (
          <div key={major} className="major-block">
            <h3 className="profile__subtitle">Ngành {major}</h3>

            {Object.entries(grades).map(([grade, classes]) => (
              <div key={grade} className="grade-block">
                <h4 className="profile__subtitle2">Khóa {grade}</h4>

                {Object.entries(classes).map(([classKey, clsData]) => {
                  const {
                    students: studentsInClass,
                    teacherName,
                    classCode,
                  } = clsData;
                  const isOpen = openClassKey === classKey;

                  return (
                    <div key={classKey} className="class-block">
                      <button
                        onClick={() => toggleClass(classKey)}
                        className="class-btn"
                      >
                        {classCode} ({studentsInClass.length} HS) - GV:{" "}
                        {teacherName || "Chưa gán"}
                      </button>

                      {isOpen && (
                        <table className="profile__table mt-2">
                          <thead>
                            <tr>
                              <th>Mã HS</th>
                              <th>Tên</th>
                              <th>Ngày sinh</th>
                              <th>Địa chỉ</th>
                              <th>Hộ khẩu</th>
                              <th>GV phụ trách</th>
                              <th>Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentsInClass.map((s: ICreatedStudent) => (
                              <tr key={s.studentId}>
                                <td>{s.studentId}</td>
                                <td>{s.name}</td>
                                <td>{formatDate(s.dob)}</td>
                                <td>{s.address || "-"}</td>
                                <td>{s.residence || "-"}</td>
                                <td>{teacherName || "Chưa gán"}</td>
                                <td>
                                  <button
                                    className="view-btn"
                                    onClick={() =>
                                      setSelectedStudent(
                                        selectedStudent?.studentId ===
                                          s.studentId
                                          ? null
                                          : s
                                      )
                                    }
                                  >
                                    Xem
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))
      )}

      {/* Modal hiển thị thông tin học sinh */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Thông tin học sinh: {selectedStudent.name}</h3>
            <table className="modal-table">
              <tbody>
                <tr>
                  <td>Mã HS:</td>
                  <td>{selectedStudent.studentId}</td>
                </tr>
                <tr>
                  <td>Ngày sinh:</td>
                  <td>{formatDate(selectedStudent.dob)}</td>
                </tr>
                <tr>
                  <td>Giới tính:</td>
                  <td>{selectedStudent.gender || "-"}</td>
                </tr>
                <tr>
                  <td>Địa chỉ:</td>
                  <td>{selectedStudent.address || "-"}</td>
                </tr>
                <tr>
                  <td>Hộ khẩu:</td>
                  <td>{selectedStudent.residence || "-"}</td>
                </tr>
                <tr>
                  <td>Lớp:</td>
                  <td>
                    {selectedStudent.classCode ||
                      `${selectedStudent.grade}${selectedStudent.classLetter}`}
                  </td>
                </tr>
                <tr>
                  <td>GV phụ trách:</td>
                  <td>{selectedStudent.teacherName || "-"}</td>
                </tr>
              </tbody>
            </table>
            <button
              className="modal-close"
              onClick={() => setSelectedStudent(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
