// src/pages/Profile/admin/ClassTab.tsx
import React from "react";

interface IClass {
  classId: string;
  grade: string;
  classLetter: string;
  major?: string;
  classCode?: string;
  teacherName?: string;
  studentIds?: string[];
}

interface Props {
  classes: IClass[];
  generateClassCode: (grade?: string, cls?: string, major?: string) => string;
}

export default function ClassTab({ classes, generateClassCode }: Props) {
  return (
    <div className="profile__card">
      <h2>Danh sách lớp</h2>
      {classes.length > 0 ? (
        <table className="profile__table">
          <thead>
            <tr>
              <th>Khóa</th>
              <th>Lớp</th>
              <th>Ngành</th>
              <th>ClassCode</th>
              <th>Giáo viên</th>
              <th>Số học sinh</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr key={cls.classId}>
                <td>{cls.grade}</td>
                <td>{cls.classLetter}</td>
                <td>{cls.major || "N/A"}</td>
                <td>
                  {cls.classCode ||
                    generateClassCode(cls.grade, cls.classLetter, cls.major)}
                </td>
                <td>{cls.teacherName || "N/A"}</td>
                <td>{cls.studentIds?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Chưa có lớp nào.</p>
      )}
    </div>
  );
}
