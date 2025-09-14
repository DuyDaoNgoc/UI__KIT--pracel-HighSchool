// src/pages/Profile/TeacherProfile.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosConfig";
import type { JSX } from "react";
import type { User } from "../../types/auth"; // FE User type

// ----- Types -----
export type IGrade = { subject: string; score: number };

export interface IStudent {
  _id: string;
  username: string;
  class?: string;
  schoolYear?: string;
  grades?: IGrade[];
  // plus any other optional fields
  [k: string]: any;
}

export interface IDailyReport {
  date: string;
  summary: string;
  updatesRequested: number;
  notes?: string;
}

// Small FE user shape (we rely on src/types/auth.User, but allow flexible access)
type FEUser = User & { [k: string]: any };

// ----- Component -----
export default function TeacherProfile(): JSX.Element {
  // useAuth returns { user, token, login, logout } per your AuthContext
  const {
    user: ctxUser,
    token: ctxToken,
    logout,
  } = useAuth() as {
    user: User | null;
    token: string | null;
    login?: (u: any, t: string) => void;
    logout?: () => void;
  };

  // local teacher state (fallback to localStorage if context not ready)
  const [teacher, setTeacher] = useState<FEUser | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return (ctxUser as FEUser) ?? null;
      const parsed = JSON.parse(raw) as FEUser;
      return (ctxUser as FEUser) ?? parsed ?? null;
    } catch {
      return (ctxUser as FEUser) ?? null;
    }
  });

  // ---------- UI state ----------
  const [activeTab, setActiveTab] = useState<
    "info" | "students" | "reports" | "settings"
  >("students");

  const [students, setStudents] = useState<IStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");

  const [gradesLocked, setGradesLocked] = useState<boolean | null>(null);
  const [loadingLock, setLoadingLock] = useState(false);

  const [reports, setReports] = useState<IDailyReport[]>([]);
  const [reportDate, setReportDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [sendingRequest, setSendingRequest] = useState(false);

  // Derived lists for filters
  const years = useMemo(() => {
    const s = new Set<string>();
    students.forEach((st) => st.schoolYear && s.add(st.schoolYear));
    return ["all", ...Array.from(s).sort()];
  }, [students]);

  const classes = useMemo(() => {
    const s = new Set<string>();
    students.forEach((st) => st.class && s.add(st.class));
    return ["all", ...Array.from(s).sort()];
  }, [students]);

  // ---------- Setup axios Authorization header (TS-safe) ----------
  useEffect(() => {
    const token = ctxToken ?? localStorage.getItem("token");
    // axiosInstance.defaults.headers.* typing in TS can be narrow,
    // so cast to any when manipulating 'common' headers.
    const hdrs = axiosInstance.defaults.headers as any;
    if (token) {
      hdrs.common = hdrs.common || {};
      hdrs.common["Authorization"] = `Bearer ${token}`;
    } else {
      if (hdrs?.common) {
        delete hdrs.common["Authorization"];
      }
    }
  }, [ctxToken]);

  // Sync teacher state when context changes
  useEffect(() => {
    if (ctxUser) {
      setTeacher(ctxUser as FEUser);
      try {
        localStorage.setItem("user", JSON.stringify(ctxUser));
      } catch {
        /* ignore storage error */
      }
    } else {
      // keep fallback from localStorage if present
      try {
        const raw = localStorage.getItem("user");
        if (raw) setTeacher(JSON.parse(raw) as FEUser);
      } catch {
        /* ignore */
      }
    }
  }, [ctxUser]);

  // Debug (useful when testing)
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug("Auth context user:", ctxUser, "token:", ctxToken);
    // eslint-disable-next-line no-console
    console.debug("Teacher local state:", teacher);
  }, [ctxUser, ctxToken, teacher]);

  // ---------- Effects: load data when teacher present ----------
  useEffect(() => {
    const role = (teacher?.role ?? "").toString().toLowerCase().trim();
    if (!teacher || (role !== "teacher" && role !== "admin")) {
      return;
    }
    fetchLockStatus();
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher]);

  // ---------- API calls ----------
  async function fetchLockStatus() {
    setLoadingLock(true);
    try {
      // try admin endpoint first, fallback to teacher
      let res = null as any;
      try {
        res = await axiosInstance.get<{ locked: boolean }>(
          "/api/admin/grades/status"
        );
      } catch {
        res = await axiosInstance.get<{ locked: boolean }>(
          "/api/grades/status"
        );
      }
      setGradesLocked(Boolean(res?.data?.locked));
    } catch (err: any) {
      if (err?.response?.status === 401) {
        logout?.();
        setGradesLocked(null);
        setLoadingLock(false);
        return;
      }
      // eslint-disable-next-line no-console
      console.warn("fetchLockStatus error:", err?.response || err);
      setGradesLocked(null);
    } finally {
      setLoadingLock(false);
    }
  }

  async function fetchStudents() {
    if (!teacher) return;
    setLoadingStudents(true);
    setStudentsError(null);
    try {
      const res = await axiosInstance.get<IStudent[]>("/api/teachers/students");
      const data = Array.isArray(res.data) ? res.data : [];
      const normalized = data.map((s) => ({
        ...s,
        schoolYear: s.schoolYear ?? "Unknown",
        class: s.class ?? "Unknown",
      }));
      setStudents(normalized);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        logout?.();
        setStudents([]);
        setStudentsError("Unauthorized — đã đăng xuất.");
        setLoadingStudents(false);
        return;
      }
      // eslint-disable-next-line no-console
      console.error("❌ Lỗi lấy dữ liệu học sinh:", err?.response || err);
      setStudents([]);
      setStudentsError(
        err?.response?.data?.message || "Không thể lấy danh sách học sinh"
      );
    } finally {
      setLoadingStudents(false);
    }
  }

  async function fetchReportsForDate(date: string) {
    setLoadingReports(true);
    setReportsError(null);
    try {
      const res = await axiosInstance.get<IDailyReport[]>(
        `/api/teachers/reports?date=${encodeURIComponent(date)}`
      );
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        logout?.();
        setReports([]);
        setReportsError("Unauthorized — đã đăng xuất.");
        setLoadingReports(false);
        return;
      }
      // eslint-disable-next-line no-console
      console.error("fetchReports error:", err?.response || err);
      setReports([]);
      setReportsError(err?.response?.data?.message || "Không thể tải báo cáo");
    } finally {
      setLoadingReports(false);
    }
  }

  async function requestUpdateGrade(
    studentId: string,
    subject: string,
    newScore: number
  ) {
    if (gradesLocked) {
      alert("❌ Điểm đang bị khóa bởi admin — không thể gửi yêu cầu.");
      return;
    }
    setSendingRequest(true);
    try {
      const payload = {
        studentId,
        subject,
        grade: newScore,
        schoolYear: filterYear === "all" ? undefined : filterYear,
        class: filterClass === "all" ? undefined : filterClass,
      };
      const res = await axiosInstance.post<{ message?: string }>(
        "/api/grades/request-update",
        payload
      );
      alert(res.data?.message || "✅ Yêu cầu cập nhật đã gửi cho admin.");
    } catch (err: any) {
      if (err?.response?.status === 401) {
        logout?.();
        setSendingRequest(false);
        return;
      }
      // eslint-disable-next-line no-console
      console.error("❌ Lỗi gửi yêu cầu:", err?.response || err);
      alert(err?.response?.data?.message || "Gửi yêu cầu thất bại");
    } finally {
      setSendingRequest(false);
    }
  }

  // ---------- Helpers ----------
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const byYear = filterYear === "all" ? true : s.schoolYear === filterYear;
      const byClass = filterClass === "all" ? true : s.class === filterClass;
      return byYear && byClass;
    });
  }, [students, filterYear, filterClass]);

  function shortId(id: string) {
    return id?.slice?.(0, 6) ?? id;
  }

  function StudentRow({ s }: { s: IStudent }) {
    const latest =
      s.grades && s.grades.length
        ? s.grades[s.grades.length - 1].score
        : undefined;
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
                const subject =
                  prompt("Môn (ví dụ: Toán):", "Toán") || "Unknown";
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

  // ---------- Render ----------
  const roleNorm = (teacher?.role ?? "").toString().toLowerCase().trim();
  if (!teacher || (roleNorm !== "teacher" && roleNorm !== "admin")) {
    return (
      <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        <p>Vui lòng đăng nhập để truy cập trang giáo viên.</p>
        <details style={{ marginTop: 8, color: "#666" }}>
          <summary>Debug info</summary>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
            Context user: {JSON.stringify(ctxUser, null, 2)}
            {"\n"}
            Local user: {JSON.stringify(teacher, null, 2)}
            {"\n"}
            Token: {String(ctxToken ?? localStorage.getItem("token") ?? "")}
          </div>
        </details>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 980,
        margin: "0 auto",
        fontFamily: "Inter, system-ui, Arial",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Trang Quản lý — Giáo Viên</h1>
          <div style={{ color: "#666", marginTop: 6 }}>
            {teacher.username} • {teacher.email}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ marginBottom: 6 }}>
            <strong style={{ color: gradesLocked ? "#c00" : "#0a7" }}>
              {loadingLock
                ? "Đang kiểm tra trạng thái..."
                : gradesLocked
                ? "⚠️ Điểm đang bị KHÓA"
                : "✅ Điểm mở"}
            </strong>
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>
            <button onClick={fetchLockStatus} style={{ marginRight: 8 }}>
              Làm mới trạng thái
            </button>
            <button onClick={fetchStudents}>Làm mới HS</button>
          </div>
        </div>
      </header>

      <nav style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["info", "students", "reports", "settings"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: activeTab === t ? "#0b79d0" : "#f3f6f9",
              color: activeTab === t ? "#fff" : "#333",
              cursor: "pointer",
            }}
          >
            {t === "info"
              ? "Thông tin"
              : t === "students"
              ? "Học sinh"
              : t === "reports"
              ? "Báo cáo"
              : "Cài đặt"}
          </button>
        ))}
      </nav>

      <main
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
          padding: 16,
        }}
      >
        {activeTab === "info" && (
          <section>
            <h3>Thông tin giáo viên</h3>
            <p>
              <strong>Tên:</strong> {teacher.username}
            </p>
            <p>
              <strong>Email:</strong> {teacher.email}
            </p>
            <p style={{ color: "#666" }}>
              Trang này dùng để quản lý học sinh, gửi yêu cầu cập nhật điểm, và
              xem báo cáo hàng ngày. Trạng thái khóa điểm do admin điều khiển.
            </p>
          </section>
        )}

        {activeTab === "students" && (
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
                <label
                  style={{ display: "block", fontSize: 12, color: "#444" }}
                >
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
                <label
                  style={{ display: "block", fontSize: 12, color: "#444" }}
                >
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
                  <StudentRow key={s._id} s={s} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "reports" && (
          <section>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div>
                <label style={{ fontSize: 12, color: "#444" }}>Chọn ngày</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  style={{ padding: 6, borderRadius: 6 }}
                />
              </div>
              <div>
                <button
                  onClick={() => fetchReportsForDate(reportDate)}
                  style={{ padding: "8px 12px", borderRadius: 6 }}
                >
                  Tải báo cáo
                </button>
              </div>
            </div>

            {loadingReports ? (
              <p>Đang tải báo cáo...</p>
            ) : reportsError ? (
              <p style={{ color: "red" }}>❌ {reportsError}</p>
            ) : reports.length === 0 ? (
              <p>Không có báo cáo cho ngày này.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {reports.map((r) => (
                  <div
                    key={r.date}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #eee",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <strong>{r.date}</strong> — {r.summary}
                      </div>
                      <div style={{ color: "#666" }}>
                        {r.updatesRequested} yêu cầu
                      </div>
                    </div>
                    {r.notes && (
                      <div style={{ marginTop: 6, color: "#444" }}>
                        {r.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "settings" && (
          <section>
            <h3>Cài đặt & trạng thái</h3>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14 }}>Trạng thái khóa điểm:</div>
                <div
                  style={{
                    marginTop: 6,
                    fontWeight: 700,
                    color: gradesLocked ? "#c00" : "#0a7",
                  }}
                >
                  {loadingLock
                    ? "Đang kiểm tra..."
                    : gradesLocked === null
                    ? "Không rõ"
                    : gradesLocked
                    ? "KHÓA"
                    : "MỞ"}
                </div>
              </div>

              <div style={{ marginLeft: "auto" }}>
                <button
                  onClick={fetchLockStatus}
                  style={{ padding: "8px 12px", borderRadius: 6 }}
                >
                  Làm mới
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12, color: "#666" }}>
              Lưu ý: trạng thái khóa do admin/quản trị viên điều khiển. Nếu điểm
              bị khóa, giáo viên không thể gửi yêu cầu cập nhật hoặc chỉnh sửa
              trực tiếp.
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
