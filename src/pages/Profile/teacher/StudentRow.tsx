// src/pages/Profile/TeacherProfile/StudentRow.tsx
import React from "react";
import type { IStudent } from "./types";

interface Props {
  s: IStudent;
  gradesLocked: boolean | null;
  sendingRequest: boolean;
  requestUpdateGrade: (
    studentId: string,
    subject: string,
    newScore: number
  ) => void;
}

export default function StudentRow({
  s,
  gradesLocked,
  sendingRequest,
  requestUpdateGrade,
}: Props) {
  const latest = s.grades?.length
    ? s.grades[s.grades.length - 1].score
    : undefined;

  function shortId(id: string) {
    return id?.slice?.(0, 6) ?? id;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>
          {s.username}{" "}
          <span style={{ color: "#888", fontWeight: 400 }}>
            ({shortId(s._id)})
          </span>
        </div>
        <div style={{ fontSize: 13, color: "#666" }}>
          Lớp: {s.class} • Năm: {s.schoolYear}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>{latest ?? "—"}</div>
          <div style={{ fontSize: 12, color: "#666" }}>Điểm mới nhất</div>
        </div>
        <div>
          <button
            onClick={() => {
              const subject = prompt("Môn (ví dụ: Toán):", "Toán") || "Unknown";
              const scoreStr = prompt("Nhập điểm mới (số):", "9");
              if (!scoreStr) return;
              const score = Number(scoreStr);
              if (Number.isNaN(score)) {
                alert("Điểm không hợp lệ");
                return;
              }
              requestUpdateGrade(s._id, subject, score);
            }}
            disabled={sendingRequest || gradesLocked === true}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: gradesLocked ? "#f5f5f5" : "#fff",
              cursor: gradesLocked ? "not-allowed" : "pointer",
            }}
            title={
              gradesLocked
                ? "Điểm đã bị khóa — không thể gửi yêu cầu"
                : "Gửi yêu cầu cập nhật"
            }
          >
            Gửi yêu cầu cập nhật
          </button>
        </div>
      </div>
    </div>
  );
}
