// src/pages/Profile/admin/StudentsTab.tsx
import React from "react";
import { ICreatedStudent } from "../../../types/student";

interface StudentsTabProps {
  studentForm: any;
  handleStudentChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  creating: boolean;
  createStudent: (e: React.FormEvent) => void;
  createdStudents: ICreatedStudent[];
  generateClassCode: (
    grade?: string,
    classLetter?: string,
    major?: string
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
  return (
    <div className="profile__card">
      <h2 className="profile__title">👨‍🎓 Quản lý học sinh</h2>

      {/* Form tạo học sinh */}
      <form onSubmit={createStudent} className="student-form">
        <input
          type="text"
          name="name"
          value={studentForm.name}
          onChange={handleStudentChange}
          placeholder="Họ tên"
        />
        <input
          type="date"
          name="dob"
          value={studentForm.dob}
          onChange={handleStudentChange}
        />
        <input
          type="text"
          name="address"
          value={studentForm.address}
          onChange={handleStudentChange}
          placeholder="Địa chỉ"
        />
        <input
          type="text"
          name="residence"
          value={studentForm.residence}
          onChange={handleStudentChange}
          placeholder="Hộ khẩu"
        />
        <input
          type="text"
          name="phone"
          value={studentForm.phone}
          onChange={handleStudentChange}
          placeholder="Số điện thoại"
        />
        <input
          type="text"
          name="grade"
          value={studentForm.grade}
          onChange={handleStudentChange}
          placeholder="Khối"
        />
        <input
          type="text"
          name="classLetter"
          value={studentForm.classLetter}
          onChange={handleStudentChange}
          placeholder="Lớp"
        />
        <input
          type="text"
          name="major"
          value={studentForm.major}
          onChange={handleStudentChange}
          placeholder="Chuyên ngành"
        />
        <input
          type="text"
          name="schoolYear"
          value={studentForm.schoolYear}
          onChange={handleStudentChange}
          placeholder="Năm học"
        />

        {/* Giới tính */}
        <div className="form-group">
          <label>Giới tính:</label>
          <select
            name="gender"
            value={studentForm.gender}
            onChange={handleStudentChange}
            required
          >
            <option value="">-- Chọn giới tính --</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>

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
                {/* Hiển thị lớp + ngành */}
                <td>
                  {s.classCode
                    ? s.classCode
                    : generateClassCode(s.grade, s.classLetter, s.major)}
                  {s.major ? ` (${s.major})` : ""}
                </td>
                <td>
                  {s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString()
                    : "-"}
                </td>
                <td>{s.gender ? s.gender : "-"}</td>
                <td className="actions-cell">
                  <button
                    onClick={() => openView(s)}
                    className="action-btn view"
                  >
                    Xem
                  </button>
                  <button
                    onClick={() => assignTeacher(s.studentId)}
                    disabled={actionLoading === s.studentId}
                    className="action-btn assign"
                  >
                    Gán GV
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
