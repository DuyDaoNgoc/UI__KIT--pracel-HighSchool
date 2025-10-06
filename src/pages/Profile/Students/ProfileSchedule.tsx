import React from "react";
import { IScheduleItem } from "../../../types/profiles";

export default function ProfileSchedule({
  schedule,
}: {
  schedule: IScheduleItem[];
}) {
  return (
    <div className="profile__card">
      <h2>Thời khóa biểu</h2>
      {schedule.length === 0 ? (
        <p>Không có dữ liệu</p>
      ) : (
        schedule.map((s, i) => (
          <p key={i}>
            <b>{s.day}:</b> {s.subjects.join(" - ")}
          </p>
        ))
      )}
    </div>
  );
}
