// src/pages/Profile/TeacherProfile/StudentsTab.tsx
import React, { useMemo } from "react";
import type { IStudent } from "./types";
import StudentRow from "./StudentRow";

interface Props {
  students: IStudent[];
  filterYear: string;
  filterClass: string;
  setFilterYear: (val: string) => void;
  setFilterClass: (val: string) => void;
  loadingStudents: boolean;
  studentsError: string | null;
  fetchStudents: () => void;
  gradesLocked: boolean | null;
  sendingRequest: boolean;
  requestUpdateGrade: (
    studentId: string,
    subject: string,
    newScore: number
  ) => void;
}

export default function StudentsTab(props: Props) {
  const {
    students,
    filterYear,
    filterClass,
    setFilterYear,
    setFilterClass,
    loadingStudents,
    studentsError,
    fetchStudents,
    gradesLocked,
    sendingRequest,
    requestUpdateGrade,
  } = props;

  const years = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(students.map((s) => s.schoolYear ?? "Unknown"))
      ).sort(),
    ],
    [students]
  );
  const classes = useMemo(
    () => [
      "all",
      ...Array.from(new Set(students.map((s) => s.class ?? "Unknown"))).sort(),
    ],
    [students]
  );

  const filteredStudents = useMemo(
    () =>
      students.filter((s) => {
        const byYear =
          filterYear === "all" ? true : s.schoolYear === filterYear;
        const byClass = filterClass === "all" ? true : s.class === filterClass;
        return byYear && byClass;
      }),
    [students, filterYear, filterClass]
  );

  return (
    <section>
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#444" }}>
            Năm học
          </label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            style={{ padding: 6, borderRadius: 6 }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#444" }}>
            Lớp
          </label>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            style={{ padding: 6, borderRadius: 6 }}
          >
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={fetchStudents}
            style={{ padding: "8px 12px", borderRadius: 6 }}
          >
            Làm mới
          </button>
        </div>
      </div>

      {loadingStudents ? (
        <p>Đang tải danh sách học sinh...</p>
      ) : studentsError ? (
        <p style={{ color: "red" }}>❌ {studentsError}</p>
      ) : filteredStudents.length === 0 ? (
        <p>Không có học sinh phù hợp bộ lọc.</p>
      ) : (
        <div
          style={{
            borderRadius: 8,
            overflow: "hidden",
            border: "1px solid #eee",
          }}
        >
          {filteredStudents.map((s) => (
            <StudentRow
              key={s._id}
              s={s}
              gradesLocked={gradesLocked}
              sendingRequest={sendingRequest}
              requestUpdateGrade={requestUpdateGrade}
            />
          ))}
        </div>
      )}
    </section>
  );
}
