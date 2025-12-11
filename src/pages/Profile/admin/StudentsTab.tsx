// src/pages/Profile/admin/StudentsTab.tsx
import React, { useState } from "react";
import { ICreatedStudent } from "../../../types/student";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../api/axiosConfig";
import StudentModal from "./StudentModal"; // ✅ import modal

interface StudentsTabProps {
  studentForm: any;
  handleStudentChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  creating: boolean;
  createStudent: (e: React.FormEvent) => Promise<{
    data: ICreatedStudent;
    emailSent?: boolean;
    rawPassword?: string;
  }>;
  createdStudents: ICreatedStudent[];
  setCreatedStudents: React.Dispatch<React.SetStateAction<ICreatedStudent[]>>;
  generateClassCode: (
    grade?: string,
    classLetter?: string,
    major?: string,
  ) => string;
  actionLoading: string | null;
  openView: (student: ICreatedStudent) => void;
  assignTeacher: (studentId: string) => void;
  deleteStudent?: (studentId: string) => Promise<void>;
  students?: ICreatedStudent[];
}

export default function StudentsTab({
  studentForm,
  handleStudentChange,
  creating,
  createStudent,
  createdStudents,
  setCreatedStudents,
  generateClassCode,
  actionLoading,
  assignTeacher,
  deleteStudent,
}: StudentsTabProps) {
  const [viewingStudent, setViewingStudent] = useState<ICreatedStudent | null>(
    null,
  );

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createStudent(e);
      const latestStudent = result?.data;
      if (!latestStudent || !latestStudent.studentId) {
        toast.error("Không tìm thấy học sinh sau khi tạo");
        return;
      }
      setCreatedStudents((prev) => [...prev, latestStudent]);

      // Student is automatically added to class via StudentModel pre-save hook
      // Show success message with password info if SMTP not configured
      const classCode =
        latestStudent.classCode ||
        generateClassCode(
          latestStudent.grade,
          latestStudent.classLetter,
          latestStudent.major,
        );

      const baseMessage = `Học sinh ${latestStudent.name} đã được tạo và thêm vào lớp ${classCode}`;

      // Nếu SMTP chưa cấu hình, hiển thị mật khẩu
      if (result?.emailSent === false && result?.rawPassword) {
        toast.success(
          `${baseMessage}\n📧 Mật khẩu: ${result.rawPassword} (Vui lòng gửi cho học sinh)`,
        );
      } else if (result?.emailSent) {
        toast.success(`${baseMessage}\n✅ Email mật khẩu đã được gửi`);
      } else {
        toast.success(baseMessage);
      }
    } catch (err: any) {
      console.error("handleCreateStudent error:", err);
      toast.error("Tạo học sinh thất bại");
    }
  };

  const handleDeleteStudent = async (studentId?: string) => {
    if (!studentId) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa học sinh này?")) return;

    // Optimistic delete: remove from UI immediately
    const previousStudents = createdStudents;
    setCreatedStudents((prev) => prev.filter((s) => s.studentId !== studentId));

    try {
      if (deleteStudent) {
        await deleteStudent(studentId);
      } else {
        const res = await axiosInstance.delete<{
          success: boolean;
          message?: string;
        }>(`/admin/students/${studentId}`);
        if (!res.data?.success) {
          // Restore if API says it failed
          setCreatedStudents(previousStudents);
          toast.error(res.data?.message || "Xóa học sinh thất bại");
          return;
        }
      }

      toast.success("Xóa học sinh thành công");
      // thông báo global event để ClassesTab cập nhật
      window.dispatchEvent(
        new CustomEvent("studentDeletedFromClass", {
          detail: { _id: studentId },
        }),
      );
    } catch (err: any) {
      console.error("handleDeleteStudent error:", err);
      // Restore on error
      setCreatedStudents(previousStudents);
      toast.error("Xóa học sinh thất bại do lỗi server");
    }
  };

  const handleResendPasswordEmail = async (studentId?: string) => {
    if (!studentId) return;
    try {
      const res = await axiosInstance.post<{
        success: boolean;
        message?: string;
        rawPassword?: string;
        emailSent?: boolean;
      }>(`/admin/students/${studentId}/resend-password-email`);

      if (res.data?.success) {
        if (res.data?.emailSent) {
          toast.success("✅ Email mật khẩu đã được gửi thành công!");
        } else {
          // SMTP chưa cấu hình, hiển thị mật khẩu
          toast.success(
            `Mật khẩu: ${res.data?.rawPassword} (Vui lòng gửi cho học sinh)`,
          );
        }
      } else {
        toast.error(res.data?.message || "Gửi email thất bại");
      }
    } catch (err: any) {
      console.error("handleResendPasswordEmail error:", err);
      toast.error("Lỗi gửi email mật khẩu");
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
          type="email"
          name="email"
          value={studentForm.email || ""}
          onChange={handleStudentChange}
          placeholder="Email (tùy chọn)"
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
        <p className="form-note" style={{ marginTop: 8, fontSize: 13 }}>
          Nhập email để hệ thống tự động tạo tài khoản cho học sinh (mật khẩu
          mặc định là mã HS). Mật khẩu sẽ được gửi tới email nếu SMTP được cấu
          hình, nếu không sẽ được ghi vào logs.
        </p>
      </form>

      {/* Danh sách học sinh */}
      <div className="student-list">
        <h3 className="profile__subtitle">Danh sách học sinh đã tạo</h3>
        <table className="profile__table">
          <thead>
            <tr>
              <th>Mã HS</th>
              <th>Tên</th>
              <th>Email</th>
              <th>Lớp</th>
              <th>Ngành</th>
              <th>Ngày tạo</th>
              <th>Giới tính</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {createdStudents.map((s, index) => (
              <tr key={`${s.studentId}-${index}`}>
                <td>{s.studentId}</td>
                <td>{s.name}</td>
                <td>{s.email || "-"}</td>
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
                    onClick={() => setViewingStudent(s)}
                    className="action-btn view"
                  >
                    Xem
                  </button>
                  <button
                    onClick={() => handleResendPasswordEmail(s.studentId)}
                    className="action-btn send"
                    title="Gửi lại email mật khẩu"
                  >
                    📧 Mật khẩu
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

      {/* Modal chung */}
      <StudentModal
        viewing={!!viewingStudent}
        selectedStudent={viewingStudent}
        closeView={() => setViewingStudent(null)}
        assignTeacher={assignTeacher}
        deleteStudent={handleDeleteStudent}
        generateClassCode={generateClassCode}
      />

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
