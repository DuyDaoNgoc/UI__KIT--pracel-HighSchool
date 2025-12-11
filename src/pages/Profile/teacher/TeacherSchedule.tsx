import React from "react";

interface IScheduleItem {
  day: string;
  subject: string;
  startTime: string;
  endTime: string;
}

interface Props {
  schedule: IScheduleItem[];
}

export default function TeacherSchedule({ schedule }: Props) {
  const groupedByDay: Record<string, IScheduleItem[]> = {};

  schedule.forEach((item) => {
    if (!groupedByDay[item.day]) {
      groupedByDay[item.day] = [];
    }
    groupedByDay[item.day].push(item);
  });

  const days = [
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
    "Chủ Nhật",
  ];
  const sortedDays = days.filter((d) => groupedByDay[d]);

  return (
    <div className="profile__card">
      <h2>Thời khóa biểu</h2>
      {schedule.length === 0 ? (
        <p>Không có thời khóa biểu</p>
      ) : (
        <div>
          {sortedDays.map((day) => (
            <div key={day} style={{ marginBottom: "1.5rem" }}>
              <h3>{day}</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5f5f5" }}>
                    <th
                      style={{
                        padding: "0.5rem",
                        textAlign: "left",
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      Môn học
                    </th>
                    <th
                      style={{
                        padding: "0.5rem",
                        textAlign: "left",
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      Thời gian
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByDay[day].map((item, idx) => (
                    <tr key={idx}>
                      <td
                        style={{
                          padding: "0.5rem",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {item.subject}
                      </td>
                      <td
                        style={{
                          padding: "0.5rem",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {item.startTime} - {item.endTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
