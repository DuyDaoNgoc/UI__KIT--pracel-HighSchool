// src/pages/Profile/admin/StudentModal.tsx
import React from "react";
import { UserPlus2, Trash2 } from "lucide-react";
import { ICreatedStudent } from "../../../types/student";

interface Props {
  viewing: boolean;
  selectedStudent: ICreatedStudent | null;
  closeView: () => void;
  assignTeacher: (studentId: string) => void;
  deleteStudent: (studentId: string) => void;
  generateClassCode: (
    grade?: string,
    classLetter?: string,
    major?: string,
  ) => string;
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

  const infoMap: { [key: string]: string } = {
    "Mã HS": selectedStudent.studentId || "-",
    "Họ tên": selectedStudent.name || "-",
    "Ngày sinh": selectedStudent.dob
      ? new Date(selectedStudent.dob).toLocaleDateString()
      : "-",
    Khối: selectedStudent.grade?.toString() || "-",
    Lớp: selectedStudent.classLetter || "-",
    Ngành: selectedStudent.major || "-",
    "Class Code":
      selectedStudent.classCode ||
      generateClassCode(
        selectedStudent.grade?.toString(),
        selectedStudent.classLetter,
        selectedStudent.major,
      ),
    "Niên khóa": selectedStudent.schoolYear || "-",
    "Giới tính": selectedStudent.gender || "-",
    Email: selectedStudent.email || "-",
    SĐT: selectedStudent.phone || "-",
    "Nơi ở": selectedStudent.residence || "-",
    "Địa chỉ": selectedStudent.address || "-",
    "Ngày tạo": selectedStudent.createdAt
      ? new Date(selectedStudent.createdAt).toLocaleString()
      : "-",
  };

  return (
    <div className="profile-modal" onClick={closeView}>
      <div
        className="profile-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Chi tiết học sinh</h3>
        <table className="modal-table">
          <tbody>
            {Object.entries(infoMap).map(([label, value]) => (
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
              selectedStudent.studentId &&
              deleteStudent(selectedStudent.studentId)
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
