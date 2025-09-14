// src/pages/Profile/admin/StudentTab.tsx
import React from "react";
import { Eye, Trash2, UserPlus2 } from "lucide-react";

interface ICreatedStudent {
  studentId: string;
  name: string;
  dob?: string;
  address?: string;
  residence?: string;
  phone?: string;
  grade?: string;
  classLetter?: string;
  schoolYear?: string;
  major?: string;
  classCode?: string;
  createdAt?: string;
}

interface Props {
  studentForm: any;
  handleStudentChange: (e: React.ChangeEvent<any>) => void;
  createStudent: (e: React.FormEvent) => void;
  creating: boolean;
  createdStudents: ICreatedStudent[];
  actionLoading: string | null;
  openView: (s: ICreatedStudent) => void;
  deleteStudent: (id: string) => void;
  assignTeacher: (id: string) => void;
  generateClassCode: (grade?: string, cls?: string, major?: string) => string;
}

export default function StudentTab({
  studentForm,
  handleStudentChange,
  createStudent,
  creating,
  createdStudents,
  actionLoading,
  openView,
  deleteStudent,
  assignTeacher,
  generateClassCode,
}: Props) {
  return (
    <div className="profile__card">
      <h2>Tạo thông tin học sinh</h2>

      <form
        onSubmit={createStudent}
        className="profile__form"
        style={{ marginBottom: 18 }}
      >
        <input
          name="name"
          placeholder="Họ tên học sinh"
          value={studentForm.name}
          onChange={handleStudentChange}
          required
        />
        <input
          type="date"
          name="dob"
          value={studentForm.dob}
          onChange={handleStudentChange}
          required
        />
        <input
          name="address"
          placeholder="Địa chỉ"
          value={studentForm.address}
          onChange={handleStudentChange}
          required
        />
        <input
          name="residence"
          placeholder="Nơi ở"
          value={studentForm.residence}
          onChange={handleStudentChange}
        />
        <input
          name="phone"
          placeholder="Số điện thoại"
          value={studentForm.phone}
          onChange={handleStudentChange}
        />
        <input
          name="grade"
          placeholder="Khóa (vd: 1,2,3)"
          value={studentForm.grade}
          onChange={handleStudentChange}
          required
        />
        <input
          name="classLetter"
          placeholder="Lớp (vd: A,B,C)"
          value={studentForm.classLetter}
          onChange={handleStudentChange}
          required
        />
        <input
          name="major"
          placeholder="Ngành (vd: Công nghệ thông tin)"
          value={studentForm.major}
          onChange={handleStudentChange}
        />
        <input
          name="schoolYear"
          placeholder="Niên khóa (vd: 2024-2025)"
          value={studentForm.schoolYear}
          onChange={handleStudentChange}
        />
        <button type="submit" disabled={creating}>
          {creating ? "Đang tạo..." : "Tạo học sinh"}
        </button>
      </form>

      <h3>Lịch sử tạo học sinh</h3>
      {createdStudents.length > 0 ? (
        <table className="profile__table">
          <thead>
            <tr>
              <th>Mã HS</th>
              <th>Họ tên</th>
              <th>Khối</th>
              <th>Lớp</th>
              <th>Ngành</th>
              <th>ClassCode</th>
              <th>Niên khóa</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {createdStudents.map((stu) => (
              <tr key={stu.studentId}>
                <td>{stu.studentId}</td>
                <td>{stu.name}</td>
                <td>{stu.grade}</td>
                <td>{stu.classLetter}</td>
                <td>{stu.major || "N/A"}</td>
                <td>
                  {stu.classCode ||
                    generateClassCode(stu.grade, stu.classLetter, stu.major)}
                </td>
                <td>{stu.schoolYear}</td>
                <td>
                  {stu.createdAt
                    ? new Date(stu.createdAt).toLocaleString()
                    : "N/A"}
                </td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button title="Xem" onClick={() => openView(stu)}>
                    <Eye size={16} />
                  </button>
                  <button
                    title="Gán giáo viên"
                    onClick={() => assignTeacher(stu.studentId)}
                    disabled={actionLoading === stu.studentId}
                  >
                    <UserPlus2 size={16} />
                  </button>
                  <button
                    title="Xóa"
                    onClick={() => deleteStudent(stu.studentId)}
                    disabled={actionLoading === stu.studentId}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Chưa có học sinh nào được tạo.</p>
      )}
    </div>
  );
}
