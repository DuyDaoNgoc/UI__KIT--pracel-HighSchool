// src/pages/Profile/admin/StudentsTab.tsx
import React from "react";
import { ICreatedStudent } from "../../../types/student";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../api/axiosConfig";

interface StudentsTabProps {
  studentForm: any;
  handleStudentChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  creating: boolean;
  createStudent: (e: React.FormEvent) => Promise<{ data: ICreatedStudent }>;
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

interface IClass {
  classCode: string;
  grade: string;
  classLetter: string;
  major: string;
  schoolYear: string;
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
  // --- Thêm học sinh vào lớp, tự tạo lớp nếu chưa tồn tại ---
  const addStudentToClass = async (student: ICreatedStudent) => {
    try {
      const classCode =
        student.classCode ||
        generateClassCode(student.grade, student.classLetter, student.major);

      if (!classCode) {
        toast.error("Không xác định được mã lớp cho học sinh");
        return;
      }

      if (!student.studentId) {
        toast.error("Không có studentId để thêm vào lớp");
        return;
      }

      // Lấy danh sách lớp từ backend
      const classesRes = await axiosInstance.get("/api/classes");
      const classesData = classesRes.data as {
        success: boolean;
        data: IClass[];
      };
      let cls = classesData.data.find((c) => c.classCode === classCode);

      if (!cls) {
        // Nếu lớp chưa tồn tại thì tạo tự động
        await axiosInstance.post("/api/classes/create", {
          grade: student.grade,
          classLetter: student.classLetter,
          major: student.major,
          schoolYear: student.schoolYear,
        });
        toast.success(`Lớp ${classCode} chưa tồn tại, đã tạo mới tự động`);
      }

      // Thêm học sinh vào lớp
      const response = await axiosInstance.post(
        `/api/classes/${classCode}/add-student`,
        {
          studentId: student.studentId,
        },
      );

      const data = response.data as { success: boolean; message?: string };

      if (data.success) {
        toast.success(
          `Học sinh ${student.name} đã được thêm vào lớp ${classCode}`,
        );
      } else {
        toast.error(data.message || "Không thể thêm học sinh vào lớp");
      }
    } catch (err: any) {
      console.error("addStudentToClass error:", err);
      toast.error("Thêm học sinh vào lớp thất bại");
    }
  };

  // --- Submit form tạo học sinh ---
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createStudent(e);
      const latestStudent = result?.data;

      if (!latestStudent || !latestStudent.studentId) {
        toast.error("Không tìm thấy học sinh sau khi tạo");
        return;
      }

      await addStudentToClass(latestStudent);
    } catch (err: any) {
      console.error("handleCreateStudent error:", err);
      toast.error("Tạo học sinh và thêm vào lớp thất bại");
    }
  };

  // --- Xóa học sinh ---
  const handleDeleteStudent = async (studentId?: string) => {
    if (!studentId) {
      toast.error("Không xác định được học sinh để xóa");
      return;
    }
    try {
      const confirm = window.confirm("Bạn có chắc chắn muốn xóa học sinh này?");
      if (!confirm) return;

      const response = await axiosInstance.delete(`/api/students/${studentId}`);
      const data = response.data as { success: boolean; message?: string };

      if (data.success) {
        toast.success(data.message || "Xóa học sinh thành công");
        // Cập nhật lại state createdStudents
        deleteStudent(studentId);
      } else {
        toast.error(data.message || "Xóa học sinh thất bại");
      }
    } catch (err: any) {
      console.error("handleDeleteStudent error:", err);
      toast.error("Xóa học sinh thất bại do lỗi server");
    }
  };

  return (
    <div className="profile__card">
      <h2 className="profile__title">Quản lý học sinh</h2>

      {/* Form tạo học sinh */}
      <form onSubmit={handleCreateStudent} className="student-form">
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

        <div className="form-group">
          <label>Giới tính:</label>
          <select
            name="gender"
            value={studentForm.gender}
            onChange={handleStudentChange}
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
              <th>Ngành</th>
              <th>Ngày tạo</th>
              <th>Giới tính</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {createdStudents.map((s) => (
              <tr key={s._id?.toString() || s.studentId}>
                <td>{s.studentId}</td>
                <td>{s.name}</td>
                <td>
                  {s.classCode ||
                    generateClassCode(s.grade, s.classLetter, s.major)}
                </td>
                <td>{s.major || "-"}</td>
                <td>
                  {s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString()
                    : "-"}
                </td>
                <td>{s.gender || "-"}</td>
                <td className="actions-cell">
                  <button
                    onClick={() => openView(s)}
                    className="action-btn view"
                  >
                    Xem
                  </button>
                  <button
                    onClick={() => handleDeleteStudent(s.studentId)}
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

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
