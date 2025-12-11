import React from "react";

interface IClass {
  _id: string;
  className?: string;
  classCode: string;
  grade: string;
  classLetter: string;
  schoolYear: string;
  studentIds?: string[];
}

interface Props {
  classes: IClass[];
}

export default function TeacherClasses({ classes }: Props) {
  return (
    <div className="profile__card">
      <h2>Lớp dạy</h2>
      {classes.length === 0 ? (
        <p>Không có lớp nào</p>
      ) : (
        <div className="classes-list">
          {classes.map((cls) => (
            <div
              key={cls._id}
              className="class-item"
              style={{
                marginBottom: "1.5rem",
                padding: "1rem",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <h3>{cls.classCode || cls.className}</h3>
              <p>
                <b>Khối:</b> {cls.grade}
              </p>
              <p>
                <b>Lớp:</b> {cls.classLetter}
              </p>
              <p>
                <b>Năm học:</b> {cls.schoolYear}
              </p>
              <p>
                <b>Số học sinh:</b> {cls.studentIds?.length || 0}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
