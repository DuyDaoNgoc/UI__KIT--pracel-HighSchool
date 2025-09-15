// src/pages/Profile/admin/StudentModal.tsx
import React from "react";
import { UserPlus2, Trash2 } from "lucide-react";

interface Props {
  viewing: boolean;
  selectedStudent: any | null;
  closeView: () => void;
  assignTeacher: (studentId: string) => void;
  deleteStudent: (studentId: string) => void;
  generateClassCode: (grade?: string, cls?: string, major?: string) => string;
}

export default function StudentModal({
  viewing,
  selectedStudent,
  closeView,
  assignTeacher,
  deleteStudent,
  generateClassCode,
}: Props) {
  if (!viewing || !selectedStudent) return null;
  return (
    <div className="profile-modal" onClick={closeView}>
      <div
        className="profile-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Chi tiết học sinh</h3>
        <table className="modal-table">
          <tbody>
            {Object.entries({
              "Mã HS": selectedStudent.studentId,
              "Họ tên": selectedStudent.name,
              "Ngày sinh": selectedStudent.dob
                ? new Date(selectedStudent.dob).toLocaleDateString()
                : "N/A",
              Khối: selectedStudent.grade,
              Lớp: selectedStudent.classLetter,
              Ngành: selectedStudent.major || "N/A",
              ClassCode:
                selectedStudent.classCode ||
                generateClassCode(
                  selectedStudent.grade,
                  selectedStudent.classLetter,
                  selectedStudent.major
                ),
              "Niên khóa": selectedStudent.schoolYear,
              SĐT: selectedStudent.phone || "N/A",
              "Nơi ở": selectedStudent.residence || "N/A",
              "Địa chỉ": selectedStudent.address || "N/A",
              "Ngày tạo": selectedStudent.createdAt
                ? new Date(selectedStudent.createdAt).toLocaleString()
                : "N/A",
            }).map(([label, value]) => (
              <tr key={label}>
                <td className="modal-label">{label}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="profile-modal__actions">
          <button
            onClick={() =>
              selectedStudent && assignTeacher(selectedStudent.studentId)
            }
            className="button action-btn"
          >
            <UserPlus2 size={14} /> Gán giáo viên
          </button>
          <button
            onClick={() =>
              selectedStudent && deleteStudent(selectedStudent.studentId)
            }
            className="button action-btn"
          >
            <Trash2 size={14} /> Xóa
          </button>
          <button onClick={closeView} className="button">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
