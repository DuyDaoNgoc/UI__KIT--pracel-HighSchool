// src/pages/Profile/admin/StudentModal.tsx
import React from "react";
import { UserPlus2, Trash2 } from "lucide-react";

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
  selectedStudent: ICreatedStudent;
  closeView: () => void;
  assignTeacher: (id: string) => void;
  deleteStudent: (id: string) => void;
  generateClassCode: (grade?: string, cls?: string, major?: string) => string;
}

export default function StudentModal({
  selectedStudent,
  closeView,
  assignTeacher,
  deleteStudent,
  generateClassCode,
}: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        zIndex: 1000,
      }}
      onClick={closeView}
    >
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 8,
          minWidth: 320,
          maxWidth: "90%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Chi tiết học sinh</h3>
        <table style={{ width: "100%", marginBottom: 12 }}>
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
            }).map(([k, v]) => (
              <tr key={k}>
                <td style={{ fontWeight: 700 }}>{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => assignTeacher(selectedStudent.studentId)}>
            <UserPlus2 size={14} /> Gán giáo viên
          </button>
          <button onClick={() => deleteStudent(selectedStudent.studentId)}>
            <Trash2 size={14} /> Xóa
          </button>
          <button onClick={closeView}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
