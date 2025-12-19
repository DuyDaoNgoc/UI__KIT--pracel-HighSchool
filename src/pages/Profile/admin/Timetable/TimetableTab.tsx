import React, { useState, useEffect } from "react";
import { ITeacher } from "../../../../types/teacherTypes";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../../api/axiosConfig";

interface ScheduleItem {
  day: string;
  subjectId: string | any;
  startTime: string;
  endTime: string;
  week?: number | string;
  date?: string; // ISO date string (yyyy-mm-dd)
  teacherId?: string | any;
  periodFrom?: string;
  canceledDates?: string[];
}

interface Timetable {
  _id: string;
  classId: string;
  schedule: ScheduleItem[];
  createdAt?: string;
  className?: string;
  periodFrom?: string;
}

interface Subject {
  _id: string;
  name: string;
  price: number;
  classId?: string; // optional: subjects are now global (no classId required)
}

interface ClassData {
  _id: string;
  classCode: string;
  teacherName?: string;
  teacherId?: string;
}

const DAYS = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật",
];

export default function TimetableTab() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Partial<ITeacher>[]>([]);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    {
      day: "Thứ Hai",
      subjectId: "",
      startTime: "07:00",
      endTime: "08:00",
      week: "",
      date: "",
      teacherId: "",
      periodFrom: "",
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [weekSelection, setWeekSelection] = useState<Record<string, string>>(
    {},
  );

  // Helper function to normalize and fetch subjects
  const fetchSubjects = async () => {
    try {
      console.log("📡 [TimetableTab] Fetching subjects from API...");
      const subjectsRes = await axiosInstance.get<{ data: Subject[] }>(
        "/subjects",
      );
      const rawSubjects = subjectsRes.data?.data || [];
      console.log("📦 [TimetableTab] Raw subjects from API:", rawSubjects);

      const normalizedSubjects = rawSubjects.map((s: any) => ({
        ...s,
        classId: s.classId
          ? s.classId?._id
            ? String(s.classId._id)
            : String(s.classId)
          : undefined,
      }));

      console.log("✅ [TimetableTab] Normalized subjects:", normalizedSubjects);
      setSubjects(normalizedSubjects);
    } catch (err) {
      console.error("❌ [TimetableTab] Error fetching subjects:", err);
    }
  };

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      // Prefer dedicated endpoint if available
      let res;
      try {
        console.log("📚 [TimetableTab] Fetching from /teachers endpoint...");
        res = await axiosInstance.get<{ data: any[] }>("/teachers");
      } catch (e) {
        // fallback to users endpoint filtered by role
        console.warn(
          "⚠️ /teachers endpoint failed, falling back to /users?role=teacher",
        );
        res = await axiosInstance.get<{ data: any[] }>("/users", {
          params: { role: "teacher" },
        });
      }

      const raw = res.data?.data ?? res.data ?? [];
      // normalize to { _id, name }
      const normalized = (Array.isArray(raw) ? raw : []).map((t: any) => ({
        _id: t._id || t._id,
        name: t.name || t.username || t.fullName || "(Không tên)",
      }));
      console.log(
        "✅ [TimetableTab] Teachers loaded:",
        normalized.length,
        normalized,
      );
      setTeachers(normalized);
      setTeachersError(null);
    } catch (err) {
      console.error("❌ [TimetableTab] Error fetching teachers:", err);
      setTeachers([]);
      try {
        setTeachersError((err as any)?.message || String(err));
      } catch (e) {
        setTeachersError("Unknown error");
      }
    }
  };

  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [timetablesRes, classesRes] = await Promise.all([
          axiosInstance.get<{ data: Timetable[] }>("/timetables"),
          axiosInstance.get<{ data: any[] }>("/classes"),
        ]);

        // Normalize timetables: ensure classId is a string (not a populated object)
        const rawTimetables = timetablesRes.data?.data || [];
        const normalizedTimetables = rawTimetables.map((t: any) => ({
          ...t,
          classId: t.classId?._id ? String(t.classId._id) : String(t.classId),
          periodFrom:
            t.periodFrom ??
            t.fromDate ??
            t.startDate ??
            (t.period && (t.period.from || t.period.start)) ??
            "",
        }));

        // Merge with existing timetables to preserve old weeks
        setTimetables((prev) => {
          if (!Array.isArray(prev) || prev.length === 0)
            return normalizedTimetables;
          // Check by _id to avoid duplicates when refetching
          const existingIds = new Set(prev.map((t) => t._id));
          const toAdd = normalizedTimetables.filter(
            (nt) => !existingIds.has(nt._id),
          );
          return [...prev, ...toAdd];
        });

        // normalize classes: ensure teacherId and teacherName are simple values
        const rawClasses = classesRes.data?.data || [];
        const normalizedClasses = rawClasses.map((c: any) => ({
          _id: c._id,
          classCode: c.classCode || c.classCode || "",
          teacherName: c.teacherName || c.teacherId?.name || "" || "",
          teacherId: c.teacherId?._id
            ? String(c.teacherId._id)
            : c.teacherId
              ? String(c.teacherId)
              : undefined,
        }));
        setClasses(normalizedClasses);
      } catch (err) {
        console.error("fetchData error:", err);
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Fetch subjects separately
    fetchSubjects();
    fetchTeachers();
  }, []);

  // When selectedClass changes, if that class has an assigned teacher, pre-fill teacherId for schedule rows
  useEffect(() => {
    if (!selectedClass || classes.length === 0) return;
    const cls = classes.find((c) => c._id === selectedClass);
    if (!cls || !cls.teacherId) return;

    setSchedule((prev) =>
      prev.map((item) => ({
        ...item,
        teacherId: item.teacherId || cls.teacherId,
      })),
    );
  }, [selectedClass, classes]);

  const normalizeTimetable = (t: any) => ({
    ...t,
    classId: t.classId?._id ? String(t.classId._id) : String(t.classId || ""),
    periodFrom:
      t.periodFrom ??
      t.fromDate ??
      t.startDate ??
      (t.period && (t.period.from || t.period.start)) ??
      "",
  });

  // Map Vietnamese day string to JS weekday number (0=Sun..6=Sat)
  const dayToWeekday = (day: string) => {
    switch (day) {
      case "Chủ Nhật":
        return 0;
      case "Thứ Hai":
        return 1;
      case "Thứ Ba":
        return 2;
      case "Thứ Tư":
        return 3;
      case "Thứ Năm":
        return 4;
      case "Thứ Sáu":
        return 5;
      case "Thứ Bảy":
        return 6;
      default:
        return 1;
    }
  };

  const addDays = (d: Date, days: number) => {
    const t = new Date(d);
    t.setDate(t.getDate() + days);
    return t;
  };

  // when periodFrom changes we don't auto-fill individual dates; user can set manually

  // Listen for subject creation events to refresh subjects list
  useEffect(() => {
    const onSubjectsUpdated = async (e: any) => {
      console.log("🎧 [TimetableTab] Received subjects:updated event:", e);
      fetchSubjects();
    };

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === "subjects:updated" && e.newValue) {
        console.log(
          "🔔 [TimetableTab] Received storage event for subjects:updated",
        );
        fetchSubjects();
      }
    };

    // Polling approach: check localStorage every 500ms for changes
    let lastSubjectUpdate = localStorage.getItem("subjects:updated");
    const pollInterval = setInterval(() => {
      const currentSubjectUpdate = localStorage.getItem("subjects:updated");
      if (currentSubjectUpdate && currentSubjectUpdate !== lastSubjectUpdate) {
        console.log(
          "⏱️ [TimetableTab] Detected subjects:updated change via polling, fetching...",
        );
        lastSubjectUpdate = currentSubjectUpdate;
        fetchSubjects();
      }
    }, 500);

    console.log("🔌 [TimetableTab] Registering subjects:updated listener");
    window.addEventListener(
      "subjects:updated",
      onSubjectsUpdated as EventListener,
    );
    window.addEventListener("storage", onStorageChange);

    return () => {
      console.log("🔌 [TimetableTab] Unregistering subjects:updated listener");
      window.removeEventListener(
        "subjects:updated",
        onSubjectsUpdated as EventListener,
      );
      window.removeEventListener("storage", onStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  const handleAddScheduleItem = () => {
    setSchedule((prev) => {
      const newItem: ScheduleItem = {
        day: "Thứ Hai",
        subjectId: "",
        startTime: "07:00",
        endTime: "08:00",
        week: "1",
        date: "",
        teacherId: "",
        periodFrom: "",
      };
      return [...prev, newItem];
    });
  };

  const handleRemoveScheduleItem = (index: number) => {
    setSchedule((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (
    index: number,
    field: keyof ScheduleItem,
    value: string,
  ) => {
    const updated = [...schedule];

    if (field === "teacherId") {
      console.log(
        `📌 [TimetableTab] Schedule item ${index} - teacherId changed to:`,
        value,
      );
    }

    // if subject cleared, also clear teacher for that row
    if (field === "subjectId") {
      updated[index] = { ...updated[index], subjectId: value } as any;
      if (!value) {
        // ensure teacher cleared when no subject
        (updated[index] as any).teacherId = "";
      }
    } else {
      updated[index] = { ...updated[index], [field]: value } as any;
    }
    setSchedule(updated);
  };

  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🎬 [TimetableTab] handleCreateTimetable called!");

    if (!selectedClass || schedule.length === 0) {
      toast.error("Vui lòng chọn lớp và thêm ít nhất một buổi học");
      return;
    }

    // Allow empty subject rows (treated as day off) — do not block creation

    setCreating(true);
    try {
      // Validate all schedule items have required fields
      console.log("🔍 [TimetableTab] Validating schedule before sending:");
      for (let i = 0; i < schedule.length; i++) {
        const s = schedule[i];
        console.log(`  Item ${i}:`, {
          subjectId: s.subjectId,
          teacherId: s.teacherId,
          hasSubject: !!s.subjectId,
          hasTeacher: !!s.teacherId,
        });
        if (s.subjectId && !s.teacherId) {
          toast.error(`Buổi học ${i + 1}: Vui lòng gán giáo viên cho môn này`);
          setCreating(false);
          return;
        }
      }

      // sanitize schedule: remove empty-string ids so backend won't try to cast "" to ObjectId
      const sanitizedSchedule = schedule.map((s, idx) => {
        const copy: any = { ...s };
        console.log(`  Sanitizing item ${idx} BEFORE:`, {
          subjectId: copy.subjectId,
          teacherId: copy.teacherId,
        });

        if (!copy.subjectId) {
          delete copy.subjectId;
          // if no subject, teacher should also be removed
          delete copy.teacherId;
        } else {
          // If subject exists, teacherId MUST exist
          if (!copy.teacherId) {
            throw new Error(
              `Teacher ID missing for subject: ${copy.subjectId}`,
            );
          }
        }

        console.log(`  Sanitizing item ${idx} AFTER:`, {
          subjectId: copy.subjectId,
          teacherId: copy.teacherId,
        });

        // ensure canceledDates is array if present
        if (Array.isArray(copy.canceledDates))
          copy.canceledDates = copy.canceledDates.slice();
        return copy;
      });

      if (editingId) {
        // Update existing timetable
        const res = await axiosInstance.patch<{ timetable: Timetable }>(
          `/timetables/${editingId}`,
          { schedule: sanitizedSchedule },
        );
        if (res.data?.timetable) {
          const nt = normalizeTimetable(res.data.timetable);
          setTimetables((prev) =>
            prev.map((t) => (t._id === editingId ? nt : t)),
          );
          toast.success("Cập nhật thời khóa biểu thành công");
          setEditingId(null);
          try {
            localStorage.setItem(
              "timetable:updated",
              JSON.stringify({ ts: Date.now(), classId: selectedClass }),
            );
          } catch (e) {}
          try {
            window.dispatchEvent(
              new CustomEvent("timetable:updated", {
                detail: { classId: selectedClass },
              }),
            );
          } catch (e) {}
        }
      } else {
        // Create new timetable (or overwrite existing for class)
        console.log("📤 [TimetableTab] Sending to backend:", {
          classId: selectedClass,
          scheduleCount: sanitizedSchedule.length,
          schedule: sanitizedSchedule,
        });

        const res = await axiosInstance.post<{ timetable: Timetable }>(
          "/timetables",
          { classId: selectedClass, schedule: sanitizedSchedule },
        );
        if (res.data?.timetable) {
          const nt = normalizeTimetable(res.data.timetable);
          // Append new timetable instead of overwriting existing ones for the class
          setTimetables((prev) => [...prev, nt]);
          toast.success("Tạo thời khóa biểu thành công");
          try {
            localStorage.setItem(
              "timetable:updated",
              JSON.stringify({ ts: Date.now(), classId: selectedClass }),
            );
          } catch (e) {}
          try {
            window.dispatchEvent(
              new CustomEvent("timetable:updated", {
                detail: { classId: selectedClass },
              }),
            );
          } catch (e) {}
        }
      }

      // reset form
      setSelectedClass("");
      setSchedule([
        {
          day: "Thứ Hai",
          subjectId: "",
          startTime: "07:00",
          endTime: "08:00",
          week: "1",
          date: "",
          teacherId: "",
          periodFrom: "",
        },
      ]);
    } catch (err: any) {
      console.error("handleCreateTimetable error:", err);
      toast.error(err.response?.data?.message || "Tạo thời khóa biểu thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleEditTimetable = (timetable: Timetable) => {
    setEditingId(timetable._id);
    setSelectedClass(String(timetable.classId || ""));

    // Normalize schedule entries (handle populated subjectId)
    const fallbackSchedule = (timetable.schedule || []).map((s: any) => ({
      day: s.day,
      subjectId: s.subjectId?._id
        ? String(s.subjectId._id)
        : String(s.subjectId || ""),
      startTime: s.startTime,
      endTime: s.endTime,
      week: s.week ?? "",
      date: s.date ?? "",
      teacherId: s.teacherId?._id
        ? String(s.teacherId._id)
        : String(s.teacherId || ""),
      periodFrom: s.periodFrom ?? s.fromDate ?? "",
    }));

    // no global period maintained in UI

    setSchedule(
      fallbackSchedule.length > 0
        ? fallbackSchedule
        : [
            {
              day: "Thứ Hai",
              subjectId: "",
              startTime: "07:00",
              endTime: "08:00",
            },
          ],
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSelectedClass("");
    setSchedule([
      {
        day: "Thứ Hai",
        subjectId: "",
        startTime: "07:00",
        endTime: "08:00",
        week: "",
        date: "",
        teacherId: "",
        periodFrom: "",
      },
    ]);
  };

  const handleDeleteTimetable = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thời khóa biểu này không?")) return;
    try {
      await axiosInstance.delete(`/timetables/${id}`);
      setTimetables((prev) => prev.filter((t) => t._id !== id));
      toast.success("Xóa thời khóa biểu thành công");
      try {
        localStorage.setItem(
          "timetable:updated",
          JSON.stringify({ ts: Date.now(), timetableId: id }),
        );
      } catch (e) {}
      try {
        window.dispatchEvent(
          new CustomEvent("timetable:updated", { detail: { timetableId: id } }),
        );
      } catch (e) {}
    } catch (err) {
      console.error("handleDeleteTimetable error:", err);
      toast.error("Xóa thất bại");
    }
  };

  const getSubjectName = (subjectIdOrObj: any) => {
    // If the schedule item has a populated subject object, prefer its name
    if (!subjectIdOrObj) return "Trống";
    if (typeof subjectIdOrObj === "object") {
      return (
        subjectIdOrObj.name ||
        subjectIdOrObj.title ||
        String(subjectIdOrObj._id || "Trống")
      );
    }

    // otherwise treat as id string
    const subject = subjects.find((s) => s._id === String(subjectIdOrObj));
    return subject?.name || "Trống";
  };

  const getTeacherName = (teacherIdOrObj: any) => {
    if (!teacherIdOrObj) return "-";
    if (typeof teacherIdOrObj === "object")
      return teacherIdOrObj.name || String(teacherIdOrObj._id || "-");
    const t = teachers.find((x) => x._id === String(teacherIdOrObj));
    return t?.name || "-";
  };

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c._id === classId);
    return cls?.classCode || "Không xác định";
  };

  const formatTimeWithSuffix = (time: string | undefined) => {
    if (!time) return "-";
    const parts = String(time).split(":");
    if (parts.length < 2) return time;
    const hh = parseInt(parts[0], 10);
    const mm = parts[1];
    const suffix = hh < 12 ? "SA" : "CH";
    const displayHour = hh % 12 === 0 ? 12 : hh % 12;
    return `${String(displayHour).padStart(2, "0")}:${mm} ${suffix}`;
  };

  const formatDateDMY = (iso: string | undefined) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleDateString("vi-VN");
    } catch (e) {
      return iso;
    }
  };

  const subjects_filtered = selectedClass
    ? subjects.filter((s) => s.classId === selectedClass || !s.classId)
    : [];

  // Main component JSX
  const jsx = (
    <div className="profile__card">
      <h2 className="profile__title">Quản lý thời khóa biểu</h2>

      {/* Form tạo thời khóa biểu */}
      <form onSubmit={handleCreateTimetable} className="form">
        <div className="form-group">
          <label>Lớp:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            required
            disabled={!!editingId}
          >
            <option value="">-- Chọn lớp --</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.classCode} ({cls.teacherName})
              </option>
            ))}
          </select>
        </div>

        {/* Debug: teachers */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="profile__subtitle">
              Danh sách giáo viên: {teachers.length}
            </div>
            <div>
              <button
                type="button"
                className="button secondary"
                onClick={fetchTeachers}
                style={{ marginRight: 8 }}
              >
                Tải lại giáo viên
              </button>
              <button
                type="button"
                className="button"
                onClick={() => console.log("Teachers state:", teachers)}
              >
                Log teachers
              </button>
            </div>
          </div>
          {teachers.length === 0 && (
            <p className="no-data">
              Chưa lấy được danh sách giáo viên.{" "}
              {teachersError ? `Lỗi: ${teachersError}` : null}
            </p>
          )}
        </div>

        {/* Lịch học */}
        <div className="schedule-container">
          <h3>Lịch học:</h3>
          {schedule.map((item, index) => (
            <div key={index} className="schedule-item">
              <select
                value={item.day}
                onChange={(e) =>
                  handleScheduleChange(index, "day", e.target.value)
                }
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>

              <select
                value={item.subjectId}
                onChange={(e) =>
                  handleScheduleChange(index, "subjectId", e.target.value)
                }
              >
                <option value=""></option>
                {subjects_filtered.map((subj) => (
                  <option key={subj._id} value={subj._id}>
                    {subj.name}
                  </option>
                ))}
              </select>

              <select
                value={item.teacherId || ""}
                onChange={(e) => {
                  console.log(
                    `📌 [TimetableTab] Selected teacher ID: ${e.target.value}`,
                  );
                  handleScheduleChange(index, "teacherId", e.target.value);
                }}
                disabled={!item.subjectId}
              >
                <option value="">-- Chọn giáo viên --</option>
                {teachers.map((t) => (
                  <option key={t._id} value={String(t._id)}>
                    {t.name} (ID: {String(t._id).substring(0, 8)}...)
                  </option>
                ))}
              </select>

              <input
                type="time"
                value={item.startTime}
                onChange={(e) =>
                  handleScheduleChange(index, "startTime", e.target.value)
                }
                required
              />

              <input
                type="time"
                value={item.endTime}
                onChange={(e) =>
                  handleScheduleChange(index, "endTime", e.target.value)
                }
                required
              />

              {/* Week number (optional) */}
              <input
                type="number"
                min={1}
                max={53}
                placeholder="Tuần"
                value={(item.week as any) || ""}
                onChange={(e) =>
                  handleScheduleChange(index, "week", e.target.value)
                }
              />

              {/* Per-item period: Từ ngày */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label
                  style={{ fontSize: 13, color: "#374151", marginRight: 6 }}
                >
                  Từ ngày:
                </label>
                <input
                  type="date"
                  value={item.periodFrom || ""}
                  onChange={(e) =>
                    handleScheduleChange(index, "periodFrom", e.target.value)
                  }
                />
              </div>

              {schedule.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveScheduleItem(index)}
                  className="button danger"
                >
                  Xóa
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddScheduleItem}
            className="button secondary"
          >
            + Thêm buổi học
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button type="submit" disabled={creating} className="button">
            {creating
              ? editingId
                ? "Đang cập nhật..."
                : "Đang tạo..."
              : editingId
                ? "Cập nhật thời khóa biểu"
                : "Tạo thời khóa biểu"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="button secondary"
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      {/* Danh sách thời khóa biểu */}
      {/* Global week selector aggregated from all timetables */}
      {timetables.length > 0 &&
        (() => {
          const gw = new Set<string>();
          for (const tt of timetables) {
            for (const it of tt.schedule || [])
              gw.add(String((it && it.week) || "Tất cả"));
          }
          const gwArr = Array.from(gw).filter(
            (w) => w !== "undefined" && w !== "",
          );
          if (!gwArr.includes("Tất cả")) gwArr.unshift("Tất cả");
          return (
            <div style={{ marginBottom: 12 }}>
              {gwArr.map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`button ${w === (weekSelection.__global || "Tất cả") ? "secondary" : ""}`}
                  onClick={() =>
                    setWeekSelection((s) => ({ ...s, __global: w }))
                  }
                  style={{ marginRight: 8 }}
                >
                  {w}
                </button>
              ))}
            </div>
          );
        })()}
      {/* Pagination Prev/Next for global week */}
      {timetables.length > 0 &&
        (() => {
          const gw = new Set<string>();
          for (const tt of timetables) {
            for (const it of tt.schedule || [])
              gw.add(String((it && it.week) || "Tất cả"));
          }
          const gwArr = Array.from(gw)
            .filter((w) => w !== "undefined" && w !== "")
            .sort((a, b) => {
              if (a === "Tất cả") return -1;
              if (b === "Tất cả") return 1;
              return parseInt(a) - parseInt(b);
            });
          if (!gwArr.includes("Tất cả")) gwArr.unshift("Tất cả");
          const currentGlobal = weekSelection.__global || "Tất cả";
          const currentIdx = gwArr.indexOf(currentGlobal);
          const hasPrev = currentIdx > 0;
          const hasNext = currentIdx >= 0 && currentIdx < gwArr.length - 1;
          return (
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
                className="button"
                onClick={() => {
                  if (hasPrev)
                    setWeekSelection((s) => ({
                      ...s,
                      __global: gwArr[currentIdx - 1],
                    }));
                }}
                disabled={!hasPrev}
              >
                ← Trang trước
              </button>
              <span
                style={{
                  fontWeight: "bold",
                  minWidth: 60,
                  textAlign: "center",
                }}
              >
                {currentGlobal}
              </span>
              <button
                type="button"
                className="button"
                onClick={() => {
                  if (hasNext)
                    setWeekSelection((s) => ({
                      ...s,
                      __global: gwArr[currentIdx + 1],
                    }));
                }}
                disabled={!hasNext}
              >
                Trang sau →
              </button>
            </div>
          );
        })()}
      <h3 className="profile__subtitle mt-4">Danh sách thời khóa biểu</h3>
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : timetables.length === 0 ? (
        <p className="no-data">Chưa có thời khóa biểu nào.</p>
      ) : (
        <div className="timetables-list">
          {timetables.map((timetable) => {
            const weeksSet = new Set<string>();
            for (const it of timetable.schedule || []) {
              weeksSet.add(String((it && it.week) || "Tất cả"));
            }
            const weeksArr = Array.from(weeksSet).filter(
              (w) => w !== "undefined" && w !== "",
            );
            if (!weeksArr.includes("Tất cả")) weeksArr.unshift("Tất cả");
            const globalWeek = weekSelection.__global || "Tất cả";
            // If a global week is selected (not "Tất cả"), use it to filter all timetables.
            const selectedWeek =
              globalWeek !== "Tất cả"
                ? globalWeek
                : weekSelection[timetable._id] || "Tất cả";

            return (
              <div key={timetable._id} className="timetable-box">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h4 style={{ margin: 0 }}>
                    {getClassName(timetable.classId)}
                  </h4>
                  <div>
                    <button
                      type="button"
                      className="button"
                      onClick={() => handleEditTimetable(timetable)}
                    >
                      Chỉnh sửa
                    </button>

                    <button
                      type="button"
                      className="button danger"
                      onClick={() => handleDeleteTimetable(timetable._id)}
                      style={{ marginLeft: 8 }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 8, marginBottom: 8 }}>
                  {weeksArr.map((w) => (
                    <button
                      key={w}
                      type="button"
                      className={`button ${w === selectedWeek ? "secondary" : ""}`}
                      onClick={() =>
                        setWeekSelection((s) => ({ ...s, [timetable._id]: w }))
                      }
                      style={{ marginRight: 8 }}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                <table className="timetable-table">
                  <thead>
                    <tr>
                      <th>Thứ</th>
                      <th>Môn học</th>
                      <th>Giáo viên</th>
                      <th>Bắt đầu</th>
                      <th>Kết thúc</th>
                      <th>Tuần</th>
                      <th>Ngày</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredItems = (timetable.schedule || []).filter(
                        (item: any) => {
                          if (selectedWeek === "Tất cả") return true;
                          return (
                            String((item && item.week) || "") ===
                            String(selectedWeek)
                          );
                        },
                      );

                      if (filteredItems.length === 0) {
                        return (
                          <tr>
                            <td
                              colSpan={8}
                              style={{ textAlign: "center", color: "#999" }}
                            >
                              Tuần {selectedWeek} không có dữ liệu
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <>
                          {filteredItems.map((item: any, idx: number) => {
                            const itemFrom = (item as any).periodFrom || "";
                            let dateCell = "-";
                            if (itemFrom) {
                              dateCell = formatDateDMY(itemFrom);
                            } else if ((item as any).date) {
                              dateCell = formatDateDMY((item as any).date);
                            }

                            return (
                              <tr key={idx}>
                                <td>{item.day}</td>
                                <td>{getSubjectName(item.subjectId)}</td>
                                <td>
                                  {getTeacherName((item as any).teacherId)}
                                </td>
                                <td>{formatTimeWithSuffix(item.startTime)}</td>
                                <td>{formatTimeWithSuffix(item.endTime)}</td>
                                <td>{(item as any).week ?? "-"}</td>
                                <td>{dateCell}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="button secondary"
                                    onClick={async () => {
                                      const input = window.prompt(
                                        "Nhập ngày hoãn (YYYY-MM-DD):",
                                      );
                                      if (!input) return;
                                      const d = new Date(input);
                                      if (Number.isNaN(d.getTime())) {
                                        alert("Ngày không hợp lệ");
                                        return;
                                      }
                                      try {
                                        const updatedSchedule = (
                                          timetable.schedule || []
                                        ).map((it: any, i: number) => {
                                          if (i !== idx) return it;
                                          const existing = Array.isArray(
                                            it.canceledDates,
                                          )
                                            ? it.canceledDates.slice()
                                            : [];
                                          if (!existing.includes(input))
                                            existing.push(input);
                                          return {
                                            ...it,
                                            canceledDates: existing,
                                          };
                                        });
                                        await axiosInstance.patch(
                                          `/timetables/${timetable._id}`,
                                          { schedule: updatedSchedule },
                                        );
                                        setTimetables((prev) =>
                                          prev.map((pt) =>
                                            pt._id === timetable._id
                                              ? {
                                                  ...pt,
                                                  schedule: updatedSchedule,
                                                }
                                              : pt,
                                          ),
                                        );
                                        toast.success("Đã đánh dấu hoãn ngày");
                                      } catch (err) {
                                        console.error("postpone error:", err);
                                        toast.error("Hoãn ngày thất bại");
                                      }
                                    }}
                                  >
                                    Hoãn
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );

  return jsx;
}
