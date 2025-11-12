import React, { useEffect } from "react";
import { ICreatedStudent } from "../../../types/student";

interface StudentsTabProps {
  studentForm: any;
  handleStudentChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  creating: boolean;
  createStudent: (e: React.FormEvent) => void;
  createdStudents: ICreatedStudent[];
  generateClassCode: (
    grade?: string,
    classLetter?: string,
    major?: string,
  ) => string;
  actionLoading: string | null;
  openView: (student: ICreatedStudent) => void;
  assignTeacher: (studentId: string) => void;
  deleteStudent: (studentId: string) => void;
}

export default function StudentsTab({
  studentForm,
  handleStudentChange,
  creating,
  createStudent,
  createdStudents,
  generateClassCode,
  actionLoading,
  openView,
  assignTeacher,
  deleteStudent,
}: StudentsTabProps) {
  useEffect(() => {
    // Fetch created students from API when component mounts
    const fetchStudents = async () => {
      // Call your API to get students
      // const response = await fetch('/api/students');
      // const data = await response.json();
      // setCreatedStudents(data);
    };

    fetchStudents();
  }, []);

  return (
    <div className="profile__card">
      <h2 className="profile__title"> Quản lý học sinh</h2>
      {/* Form tạo học sinh */}
      <form onSubmit={createStudent} className="student-form">
        {/* Input fields */}
        <input
          type="text"
          name="name"
          value={studentForm.name}
          onChange={handleStudentChange}
          placeholder="Họ tên"
        />
        {/* Other input fields... */}
        <button type="submit" disabled={creating} className="button">
          {creating ? "Đang tạo..." : "Tạo học sinh"}
        </button>
      </form>

      {/* Danh sách học sinh */}
      <div className="student-list">
        <h3 className="profile__subtitle">Danh sách học sinh đã tạo</h3>
        <table className="profile__table">
          <thead>
            <tr>
              <th>Mã HS</th>
              <th>Tên</th>
              <th>Lớp</th>
              <th>Ngành</th>
              <th>Ngày tạo</th>
              <th>Giới tính</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {createdStudents.map((s) => (
              <tr key={s.studentId}>
                <td>{s.studentId}</td>
                <td>{s.name}</td>
                <td>{s.classCode}</td>
                <td>{s.major}</td>
                <td>
                  {s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString()
                    : "-"}
                </td>
                <td>{s.gender}</td>
                <td className="actions-cell">
                  <button
                    onClick={() => openView(s)}
                    className="action-btn view"
                  >
                    Xem
                  </button>
                  <button
                    onClick={() => deleteStudent(s.studentId)}
                    disabled={actionLoading === s.studentId}
                    className="action-btn delete"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
