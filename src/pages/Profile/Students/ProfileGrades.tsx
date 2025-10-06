import React from "react";
import { IGrade } from "../../../types/profiles";

export default function ProfileGrades({ grades }: { grades: IGrade[] }) {
  return (
    <div className="profile__card">
      <h2>Điểm số & Hạnh kiểm</h2>
      {grades.length === 0 ? (
        <p>Không có dữ liệu</p>
      ) : (
        grades.map((g) => (
          <p key={g.subject}>
            <b>{g.subject}:</b> {g.score}
          </p>
        ))
      )}
    </div>
  );
}
