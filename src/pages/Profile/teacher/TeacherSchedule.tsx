import React, { useEffect, useState } from "react";
import "../../../stylesheets/components/profile/_TimetableTab.scss";
import axiosInstance from "../../../api/axiosConfig";
import { useSocket } from "../../../Components/settings/hook/IOserver/useSocket";

interface IScheduleItem {
  _id?: string;
  day: string;
  subject: string;
  startTime: string;
  endTime: string;
  // optional metadata that might come from merged timetables
  classId?: string;
  timetableId?: string;
}

interface Props {
  // component accepts either a flat schedule array or an array of timetables
  schedule: IScheduleItem[] | any[];
  teacherId?: string;
}

export default function TeacherSchedule({ schedule: initialSchedule }: Props) {
  // Read-only schedule: teachers view the timetable(s) set by admin.
  // Support either a flat array of schedule items or an array of timetables to be merged.
  const [postponeState, setPostponeState] = useState<Record<string, string>>(
    {},
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IScheduleItem | null>(null);
  const [reason, setReason] = useState("");
  const [requestedDate, setRequestedDate] = useState("");

  // normalize input: if initialSchedule is an array of timetables (objects with `schedule`), flatten them
  let schedule: IScheduleItem[] = [];
  if (!initialSchedule) schedule = [];
  else if (Array.isArray(initialSchedule) && initialSchedule.length > 0) {
    if (
      (initialSchedule[0] as any).schedule &&
      Array.isArray((initialSchedule[0] as any).schedule)
    ) {
      schedule = (initialSchedule as any[]).flatMap((t) =>
        (t.schedule || []).map((s: any) => ({
          ...(s || {}),
          timetableId: t._id,
          classId: t.classId,
        })),
      );
    } else {
      schedule = initialSchedule as IScheduleItem[];
    }
  }

  const groupedByDay: Record<string, IScheduleItem[]> = {};
  schedule.forEach((item) => {
    if (!groupedByDay[item.day]) groupedByDay[item.day] = [];
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
  const sortedDays = days; // always show all days

  // fetch class list to map classId -> classCode for display
  const [classesMap, setClassesMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axiosInstance.get<any>("/classes");
        const list = res.data?.data || res.data || [];
        if (!mounted) return;
        const m: Record<string, string> = {};
        for (const c of list) {
          if (c && c._id)
            m[String(c._id || c._id)] = c.classCode || c.className || "";
        }
        setClassesMap(m);
      } catch (e) {
        console.warn("Failed to fetch classes for teacher schedule:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const submitPostponeRequest = async () => {
    if (!selectedItem) return;
    const key =
      selectedItem._id || `${selectedItem.day}-${selectedItem.startTime}`;
    try {
      setPostponeState((s) => ({ ...s, [key]: "pending" }));
      const payload = {
        itemId: selectedItem._id,
        timetableId: selectedItem.timetableId,
        classId: selectedItem.classId,
        subject: selectedItem.subject,
        reason,
        requestedDate: requestedDate || undefined,
      };
      await axiosInstance.post("/postpone-requests", payload);
      setPostponeState((s) => ({ ...s, [key]: "sent" }));
      setModalOpen(false);
      setSelectedItem(null);
      try {
        localStorage.setItem(
          "postpone:updated",
          JSON.stringify({ ts: Date.now() }),
        );
      } catch (e) {}
    } catch (err) {
      console.error("submitPostponeRequest error:", err);
      setPostponeState((s) => ({ ...s, [key]: "failed" }));
    }
  };

  // load teacher's own postpone requests and map statuses to postponeState
  const fetchMyPostponeRequests = async () => {
    try {
      const res = await axiosInstance.get<{ data: any[] }>(
        "/postpone-requests/me",
      );
      const list = res.data?.data || [];
      const m: Record<string, string> = {};
      for (const r of list) {
        const k = r.itemId || `${r.day}-${r.startTime}`;
        m[String(k)] = r.status || "pending";
      }
      setPostponeState((s) => ({ ...s, ...m }));
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchMyPostponeRequests();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "postpone:updated") fetchMyPostponeRequests();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // listen for server socket events to refresh postpone statuses when admin reviews
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;

    const handler = (payload: any) => {
      try {
        // If payload contains data about the reviewed postpone, refresh local state
        fetchMyPostponeRequests();
      } catch (e) {
        console.warn("postpone socket handler error:", e);
      }
    };

    socket.on("postpone:reviewed", handler);
    socket.on("timetable:updated", handler);

    return () => {
      socket.off("postpone:reviewed", handler);
      socket.off("timetable:updated", handler);
    };
  }, [socket]);
  // build flattened rows per day; if day empty add a Trống row
  const flattenedRows: Array<any> = [];
  for (const day of sortedDays) {
    const items = groupedByDay[day] || [];
    if (!items || items.length === 0) {
      flattenedRows.push({ day, isEmpty: true });
    } else {
      // sort items by startTime
      items.sort((a, b) =>
        (a.startTime || "") < (b.startTime || "") ? -1 : 1,
      );
      for (const it of items)
        flattenedRows.push({ day, isEmpty: false, item: it });
    }
  }

  // build week list for UI (unique weeks from schedule)
  const weeksSet = new Set<string>();
  for (const r of flattenedRows) {
    if (!r.isEmpty) {
      weeksSet.add(String((r.item && r.item.week) || "Tất cả"));
    }
  }
  const weeks = Array.from(weeksSet)
    .filter((w) => w !== "undefined" && w !== "")
    .sort((a, b) => {
      if (a === "Tất cả") return -1;
      if (b === "Tất cả") return 1;
      return parseInt(a) - parseInt(b);
    });
  // ensure a default 'Tất cả' option
  if (!weeks.includes("Tất cả")) weeks.unshift("Tất cả");
  const [selectedWeek, setSelectedWeek] = useState<string>("Tất cả");

  return (
    <div className="profile__card schedule-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2>Thời khóa biểu</h2>
      </div>

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
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {flattenedRows
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
                      <td>
                        <button className="btn btn-small" disabled>
                          Hoãn
                        </button>
                      </td>
                    </tr>
                  );
                }

                const item = r.item;
                const key = item._id || `${r.day}-${item.startTime}-${idx}`;
                return (
                  <tr key={key}>
                    <td>{r.day}</td>
                    <td>{item.subject}</td>
                    <td>
                      {Array.isArray((item as any).canceledDates) &&
                        (item as any).canceledDates.length > 0 && (
                          <div
                            style={{
                              color: "green",
                              fontWeight: 600,
                              marginBottom: 6,
                            }}
                          >
                            Đã hoãn
                          </div>
                        )}
                      {item.classId
                        ? classesMap[item.classId] || item.classId
                        : "-"}
                    </td>
                    <td>{(item as any).teacherName || "-"}</td>
                    <td>{item.startTime || "-"}</td>
                    <td>{item.endTime || "-"}</td>
                    <td>{item.week || "-"}</td>
                    <td>{item.date || "-"}</td>
                    <td>
                      {postponeState[key] === "approved" ? (
                        <span style={{ color: "green", fontWeight: 600 }}>
                          Đã hoãn
                        </span>
                      ) : postponeState[key] === "rejected" ? (
                        <span style={{ color: "#c0392b", fontWeight: 600 }}>
                          Bị từ chối
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-small"
                            onClick={() => {
                              setSelectedItem(item as IScheduleItem);
                              setModalOpen(true);
                            }}
                            title="Gửi yêu cầu hoãn đến admin"
                          >
                            Hoãn
                          </button>
                          {postponeState[key] === "sent" && (
                            <small style={{ color: "green" }}> Đã gửi</small>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {modalOpen && selectedItem && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => {
            // click on backdrop closes
            setModalOpen(false);
            setSelectedItem(null);
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 6,
              minWidth: 320,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Yêu cầu hoãn: {selectedItem.subject}</h3>
            <div style={{ marginBottom: 8 }}>
              <label>Lý do</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Ngày yêu cầu (nếu cần)</label>
              <input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setModalOpen(false);
                  setSelectedItem(null);
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => submitPostponeRequest()}
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
