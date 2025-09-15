// src/pages/Profile/admin/ClassesTab.tsx
import React, { useState, useEffect } from "react";
import { ICreatedStudent } from "../../../types/student";
import axiosInstance from "../../../api/axiosConfig";

interface ClassesTabProps {
  students: ICreatedStudent[];
}

// Hàm lấy chữ cái đầu của mỗi từ, giữ nguyên Unicode
const getMajorAbbrev = (major: string) => {
  return major
    .split(/\s+/)
    .map((w) => {
      const match = w.match(/\p{L}/u); // \p{L} = bất cứ ký tự chữ cái Unicode nào
      return match ? match[0].toUpperCase() : "";
    })
    .join("");
};

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

        const majorAbbrev = getMajorAbbrev(s.major);
        const classCode =
          s.classCode || `${s.grade}${s.classLetter}${majorAbbrev}`;

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

  // ===== Gom nhóm học sinh theo ngành =====
  const groupedByMajor = studentList.reduce<Record<string, ICreatedStudent[]>>(
    (acc, s) => {
      const major = s.major || "Chưa có ngành";
      if (!acc[major]) acc[major] = [];
      acc[major].push(s);
      return acc;
    },
    {}
  );

  // ===== Gom theo lớp trong mỗi ngành =====
  const classesByMajor = Object.entries(groupedByMajor).map(
    ([major, studentsInMajor]) => {
      const groupedByClass: Record<
        string,
        { students: ICreatedStudent[]; teacherName?: string; classCode: string }
      > = {};

      studentsInMajor.forEach((s) => {
        const majorAbbrev = getMajorAbbrev(major);
        const code =
          s.classCode ||
          `${s.grade || "X"}${s.classLetter || "X"}${majorAbbrev}`;

        if (!groupedByClass[code]) {
          groupedByClass[code] = {
            students: [],
            teacherName: s.teacherName,
            classCode: code,
          };
        }
        groupedByClass[code].students.push(s);
      });

      return { major, classes: groupedByClass };
    }
  );

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
        classesByMajor.map(({ major, classes }) => (
          <div key={major} className="major-block">
            <h3 className="profile__subtitle">Ngành {major}</h3>

            {Object.entries(classes).length === 0 ? (
              <p className="no-class">Chưa có lớp nào trong ngành này.</p>
            ) : (
              Object.entries(classes).map(([classKey, clsData]) => {
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
                          {studentsInClass.map((s) => (
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
                                      selectedStudent?.studentId === s.studentId
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
              })
            )}
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
