import React from "react";
import { IScheduleItem } from "../../../types/profiles";
import "../../../stylesheets/components/profile/_TimetableTab.scss";

export default function ProfileSchedule({
  schedule,
}: {
  schedule: IScheduleItem[];
}) {
  // Detect detailed flattened schedule items (from timetables) vs grouped subjects
  const isDetailed =
    schedule.length > 0 && Boolean((schedule as any)[0].subject);

  if (!isDetailed) {
    return (
      <div className="profile__card schedule-card">
        <h2>Thời khóa biểu</h2>
        {schedule.length === 0 ? (
          <p>Không có dữ liệu</p>
        ) : (
          (schedule as IScheduleItem[]).map((s, i) => {
            const subjects = s.subjects || [];
            const half = Math.ceil(subjects.length / 2);
            const morning = subjects.slice(0, half);
            const afternoon = subjects.slice(half);

            return (
              <div key={i}>
                <h3 className="schedule-day">{s.day}</h3>
                <div className="schedule-row">
                  <div className="schedule-col">
                    <strong>Sáng</strong>
                    {morning.length === 0 ? (
                      <p className="schedule-empty">—</p>
                    ) : (
                      morning.map((sub, idx) => (
                        <p key={idx} className="schedule-subject">
                          {sub}
                        </p>
                      ))
                    )}
                  </div>

                  <div className="schedule-col">
                    <strong>Chiều</strong>
                    {afternoon.length === 0 ? (
                      <p className="schedule-empty">—</p>
                    ) : (
                      afternoon.map((sub, idx) => (
                        <p key={idx} className="schedule-subject">
                          {sub}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // Render read-only merged table like teacher's view
  const days = [
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
    "Chủ Nhật",
  ];

  // group detailed items by day
  const grouped: Record<string, any[]> = {};
  for (const it of schedule as any[]) {
    const day = it.day || "Unknown";
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(it);
  }

  const flattened: any[] = [];
  for (const d of days) {
    const items = grouped[d] || [];
    if (items.length === 0) flattened.push({ day: d, isEmpty: true });
    else {
      items.sort((a, b) =>
        (a.startTime || "") < (b.startTime || "") ? -1 : 1,
      );
      for (const it of items)
        flattened.push({ day: d, isEmpty: false, item: it });
    }
  }

  // weeks available from schedule
  const weeksSet = new Set<string>();
  for (const r of flattened) {
    if (!r.isEmpty) weeksSet.add(String((r.item && r.item.week) || "Tất cả"));
  }
  const weeks = Array.from(weeksSet)
    .filter((w) => w !== "undefined" && w !== "")
    .sort((a, b) => {
      if (a === "Tất cả") return -1;
      if (b === "Tất cả") return 1;
      return parseInt(a) - parseInt(b);
    });
  if (!weeks.includes("Tất cả")) weeks.unshift("Tất cả");
  const [selectedWeek, setSelectedWeek] = React.useState<string>("Tất cả");

  return (
    <div className="profile__card schedule-card">
      <h2>Thời khóa biểu</h2>
      <div style={{ marginBottom: 12 }}>
        {weeks.map((w) => (
          <button
            key={w}
            className={`btn btn-small ${w === selectedWeek ? "active" : ""}`}
            onClick={() => setSelectedWeek(w)}
            style={{ marginRight: 8 }}
          >
            {w}
          </button>
        ))}
      </div>
      {/* Pagination Prev/Next for weeks */}
      {weeks.length > 1 && (
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={() => {
              const idx = weeks.indexOf(selectedWeek);
              if (idx > 0) setSelectedWeek(weeks[idx - 1]);
            }}
            disabled={weeks.indexOf(selectedWeek) <= 0}
          >
            ← Trang trước
          </button>
          <span
            style={{ fontWeight: "bold", minWidth: 60, textAlign: "center" }}
          >
            {selectedWeek}
          </span>
          <button
            type="button"
            className="btn"
            onClick={() => {
              const idx = weeks.indexOf(selectedWeek);
              if (idx < weeks.length - 1) setSelectedWeek(weeks[idx + 1]);
            }}
            disabled={weeks.indexOf(selectedWeek) >= weeks.length - 1}
          >
            Trang sau →
          </button>
        </div>
      )}
      <div className="timetable-box">
        <table className="timetable-table teacher-timetable">
          <thead>
            <tr>
              <th>Thứ</th>
              <th>Môn học</th>
              <th>Lớp</th>
              <th>Giáo viên</th>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th>Tuần</th>
              <th>Ngày</th>
            </tr>
          </thead>
          <tbody>
            {flattened
              .filter((r) => {
                if (selectedWeek === "Tất cả") return true;
                if (r.isEmpty) return true;
                return (
                  String((r.item && r.item.week) || "") === String(selectedWeek)
                );
              })
              .map((r, idx) => {
                if (r.isEmpty) {
                  return (
                    <tr key={`empty-${r.day}`}>
                      <td>{r.day}</td>
                      <td>Trống</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                    </tr>
                  );
                }

                const item = r.item;
                const key = item._id || `${r.day}-${item.startTime}-${idx}`;
                return (
                  <tr key={key}>
                    <td>{r.day}</td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>{item.subject}</span>
                        {Array.isArray((item as any).canceledDates) &&
                          (item as any).canceledDates.length > 0 && (
                            <span
                              className="badge-postponed"
                              title={`Hoãn: ${(item as any).canceledDates.join(", ")}`}
                            >
                              Hoãn
                            </span>
                          )}
                        {(!Array.isArray((item as any).canceledDates) ||
                          (item as any).canceledDates.length === 0) &&
                          (item as any).postponeStatus === "approved" && (
                            <span className="badge-postponed">Hoãn</span>
                          )}
                      </div>
                    </td>
                    <td>{item.classCode || item.classId || "-"}</td>
                    <td>{item.teacherName || "-"}</td>
                    <td>{item.startTime || "-"}</td>
                    <td>{item.endTime || "-"}</td>
                    <td>{item.week || "-"}</td>
                    <td>{item.date || "-"}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
