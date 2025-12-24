import React, { useState, useEffect } from "react";
import { ITeacher } from "../../../../types/teacherTypes";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../../api/axiosConfig";
import { useSocket } from "../../../../Components/settings/hook/IOserver/useSocket";

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
        res = await axiosInstance.get<{ data: any[] }>("/teachers");
      } catch (e) {
        // fallback to users endpoint filtered by role
        console.warn(
          "/teachers endpoint not available, falling back to /users?role=teacher",
        );
        res = await axiosInstance.get<{ data: any[] }>("/users", {
          params: { role: "teacher" },
        });
      }

      const raw = res.data?.data ?? res.data ?? [];
      console.log("📡 [TimetableTab] Raw teachers from API:", raw);

      // normalize to { _id, name }
      const normalized = (Array.isArray(raw) ? raw : []).map((t: any) => ({
        _id: t._id || t._id,
        name: t.name || t.username || t.fullName || "(Không tên)",
      }));
      console.log(
        "📚 [TimetableTab] fetched teachers (normalized):",
        normalized,
      );
      setTeachers(normalized);
      setTeachersError(null);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setTeachers([]);
      try {
        setTeachersError((err as any)?.message || String(err));
      } catch (e) {
        setTeachersError("Unknown error");
      }
    }
  };

  // Admin: fetch postpone requests (if admin) and allow review
  const [postponeRequests, setPostponeRequests] = React.useState<any[]>([]);
  const fetchPostponeRequests = async () => {
    try {
      const res = await axiosInstance.get<{ data: any[] }>(
        "/postpone-requests",
      );
      const list = res.data?.data || [];
      // Only show pending requests in admin panel
      setPostponeRequests(
        (list || []).filter((x: any) => x.status === "pending"),
      );
    } catch (e) {
      // ignore: likely not admin or endpoint unavailable
      console.warn("fetchPostponeRequests failed (maybe not admin):", e);
      setPostponeRequests([]);
    }
  };

  // Fetch dữ liệu (moved to component scope so other handlers can call it)
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
        schedule: (t.schedule || []).map((item: any) => ({
          ...item,
        })),
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

  // Fetch on mount
  useEffect(() => {
    fetchData();
    fetchSubjects();
    fetchTeachers();
    fetchPostponeRequests();
  }, []);

  // Listen to socket events to refresh lists when admin reviews or timetable updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const onReviewed = (payload: any) => {
      console.log("socket postpone:reviewed", payload);
      fetchPostponeRequests();
    };
    const onTimetableUpdated = (payload: any) => {
      console.log("socket timetable:updated", payload);
      fetchData();
    };
    socket.on("postpone:reviewed", onReviewed);
    socket.on("timetable:updated", onTimetableUpdated);
    return () => {
      socket.off("postpone:reviewed", onReviewed);
      socket.off("timetable:updated", onTimetableUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // When selectedClass changes, fetch timetables for that class
  useEffect(() => {
    if (!selectedClass || classes.length === 0) return;
    // NOTE: Removed pre-fill of teacherId from class's assigned teacher
    // because class.teacherId is a User ID, but timetable teachers come from Teacher collection
    // These are different collections and have different IDs!
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

    if (!selectedClass || schedule.length === 0) {
      toast.error("Vui lòng chọn lớp và thêm ít nhất một buổi học");
      return;
    }

    // Validate that if subjectId is chosen, teacherId must also be chosen
    const hasInvalidSchedule = schedule.some((s) => {
      return s.subjectId && !s.teacherId;
    });

    if (hasInvalidSchedule) {
      toast.error("Vui lòng chọn giáo viên cho mỗi môn học");
      return;
    }

    // Also check that teachers list is not empty
    if (teachers.length === 0) {
      toast.error("⚠️ Danh sách giáo viên trống! Vui lòng tải lại giáo viên");
      return;
    }

    setCreating(true);
    try {
      // sanitize schedule: remove empty-string ids so backend won't try to cast "" to ObjectId
      const sanitizedSchedule = schedule.map((s) => {
        const copy: any = { ...s };
        if (!copy.subjectId) {
          delete copy.subjectId;
          // if no subject, teacher should also be removed
          delete copy.teacherId;
        }
        // Note: keep teacherId even if empty - let backend handle it
        // ensure canceledDates is array if present
        if (Array.isArray(copy.canceledDates))
          copy.canceledDates = copy.canceledDates.slice();
        return copy;
      });

      console.log(
        "🔍 [TimetableTab] Sanitized schedule being sent:",
        sanitizedSchedule,
      );

      // Log detailed teacher info and available teachers
      console.log(
        `📚 [TimetableTab] Available teachers in state (${teachers.length}):`,
        teachers.map((t) => `${t._id} (${t.name})`).join(", "),
      );

      sanitizedSchedule.forEach((item: any, idx: number) => {
        const hasSubject = !!item.subjectId;
        const hasTeacher = !!item.teacherId;
        console.log(
          `🎓 [TimetableTab] Schedule[${idx}]: subject=${hasSubject ? "✅" : "❌"}, teacher=${hasTeacher ? "✅" : "❌"}`,
        );

        if (item.teacherId) {
          const foundTeacher = teachers.find((t) => t._id === item.teacherId);
          console.log(
            `   └─ teacherId="${item.teacherId}" → found in dropdown: ${foundTeacher ? `✅ ${foundTeacher.name}` : "❌ NOT FOUND"}`,
          );
        }
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
        console.log(
          "📤 [handleCreateTimetable] Raw schedule (before sanitize):",
          schedule,
        );
        console.log(
          "📤 [handleCreateTimetable] Sanitized schedule (after sanitize):",
          sanitizedSchedule,
        );

        // Log exact JSON that will be sent
        const payload = { classId: selectedClass, schedule: sanitizedSchedule };
        console.log(
          "📤 [handleCreateTimetable] EXACT PAYLOAD being posted:",
          JSON.stringify(payload, null, 2),
        );

        const res = await axiosInstance.post<{ timetable: Timetable }>(
          "/timetables",
          payload,
        );

        console.log("✅ [handleCreateTimetable] Response:", res.data);
        if (res.data?.timetable) {
          const nt = normalizeTimetable(res.data.timetable);
          // Avoid duplicates: replace if same _id or same classId, otherwise append
          setTimetables((prev) => {
            try {
              if (!Array.isArray(prev) || prev.length === 0) return [nt];
              if (nt._id) {
                const existsById = prev.some((t) => t._id === nt._id);
                if (existsById)
                  return prev.map((t) => (t._id === nt._id ? nt : t));
              }
              // fallback: replace by classId if a timetable for that class already exists
              const existsByClass = prev.some((t) => t.classId === nt.classId);
              if (existsByClass)
                return prev.map((t) => (t.classId === nt.classId ? nt : t));
              return [...prev, nt];
            } catch (e) {
              console.warn(
                "Error merging new timetable, appending as fallback",
                e,
              );
              return [...prev, nt];
            }
          });
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
      console.error("❌ [handleCreateTimetable] Error:", err);
      console.error("❌ [handleCreateTimetable] Response:", err.response);
      console.error("❌ [handleCreateTimetable] Message:", err.message);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Tạo thời khóa biểu thất bại";
      toast.error(errorMessage);
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
    // If it's an object with a name property (populated from API), use it directly
    if (typeof teacherIdOrObj === "object") {
      if (teacherIdOrObj.name) return teacherIdOrObj.name;
      if (teacherIdOrObj._id) return String(teacherIdOrObj._id);
      return "-";
    }
    // If it's a string/ID, look it up in the teachers array
    const teacherId = String(teacherIdOrObj);
    const t = teachers.find((x) => x._id === teacherId);
    if (t?.name) return t.name;
    return teacherId || "-";
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

          <div style={{ marginBottom: 12 }}>
            {/* Admin: postpone requests panel (từ giáo viên) */}
            {postponeRequests.length > 0 && (
              <div
                style={{
                  marginBottom: 12,
                  border: "1px solid #eee",
                  padding: 8,
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div className="profile__subtitle">
                    Yêu cầu hoãn (từ giáo viên)
                  </div>
                  <div>
                    <button className="button" onClick={fetchPostponeRequests}>
                      Tải lại
                    </button>
                  </div>
                </div>
                <ul style={{ marginTop: 8 }}>
                  {postponeRequests.map((p) => (
                    <li
                      key={p._id}
                      style={{
                        marginBottom: 6,
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <strong>{p.subject}</strong> — lớp: {p.classId || "-"} —
                        ngày: {p.requestedDate || "-"}
                        <div style={{ color: "#666" }}>{p.reason}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="button"
                          onClick={async () => {
                            console.log("Approving postpone request", p._id);
                            try {
                              const resp = await axiosInstance.patch(
                                `/postpone-requests/${p._id}`,
                                { status: "approved" },
                              );
                              console.log("Approve response:", resp);
                              // Optimistically remove from UI
                              setPostponeRequests((prev) =>
                                prev.filter((x) => x._id !== p._id),
                              );
                              // background refresh
                              fetchPostponeRequests();
                              fetchData();
                              try {
                                localStorage.setItem(
                                  "postpone:updated",
                                  JSON.stringify({ ts: Date.now(), id: p._id }),
                                );
                              } catch (e) {}
                              try {
                                localStorage.setItem(
                                  "timetable:updated",
                                  JSON.stringify({
                                    ts: Date.now(),
                                    classId: p.classId,
                                  }),
                                );
                              } catch (e) {}
                              try {
                                window.dispatchEvent(
                                  new CustomEvent("timetable:updated", {
                                    detail: { classId: p.classId },
                                  }),
                                );
                              } catch (e) {}
                              toast.success("Đã duyệt yêu cầu");
                            } catch (err: any) {
                              console.error(
                                "Approve error:",
                                err,
                                err?.response?.data,
                              );
                              toast.error(
                                err?.response?.data?.message ||
                                  "Duyệt thất bại",
                              );
                            }
                          }}
                        >
                          Duyệt
                        </button>
                        <button
                          className="button danger"
                          onClick={async () => {
                            console.log("Rejecting postpone request", p._id);
                            try {
                              const resp = await axiosInstance.patch(
                                `/postpone-requests/${p._id}`,
                                { status: "rejected" },
                              );
                              console.log("Reject response:", resp);
                              // remove from UI optimistically
                              setPostponeRequests((prev) =>
                                prev.filter((x) => x._id !== p._id),
                              );
                              fetchPostponeRequests();
                              try {
                                localStorage.setItem(
                                  "postpone:updated",
                                  JSON.stringify({ ts: Date.now(), id: p._id }),
                                );
                              } catch (e) {}
                              toast.success("Đã từ chối");
                            } catch (err: any) {
                              console.error(
                                "Reject error:",
                                err,
                                err?.response?.data,
                              );
                              toast.error(
                                err?.response?.data?.message ||
                                  "Từ chối thất bại",
                              );
                            }
                          }}
                        >
                          Từ chối
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                onChange={(e) =>
                  handleScheduleChange(index, "teacherId", e.target.value)
                }
                disabled={!item.subjectId}
              >
                <option value="">-- Chọn giáo viên --</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
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

                            // Debug log
                            console.log(
                              `📌 [TimetableTab] Item ${idx}:`,
                              item,
                              "teacherId:",
                              (item as any).teacherId,
                            );

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
