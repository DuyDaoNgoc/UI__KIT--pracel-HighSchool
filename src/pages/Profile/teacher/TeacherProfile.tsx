// src/pages/Profile/TeacherProfile/index.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import type { FEUser, IStudent, IDailyReport } from "./types";
import InfoTab from "./InfoTab";
import StudentsTab from "./StudentsTab";
import ReportsTab from "./ReportsTab";
import SettingsTab from "./SettingsTab";
import { useStudents, useReports, useLockStatus } from "./hooks";
import axiosInstance from "../../../api/axiosConfig";

export default function TeacherProfile() {
  const { user: ctxUser, token: ctxToken, logout } = useAuth() as any;
  const [teacher, setTeacher] = useState<FEUser | null>(ctxUser);

  const [activeTab, setActiveTab] = useState<
    "info" | "students" | "reports" | "settings"
  >("students");
  const [filterYear, setFilterYear] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [sendingRequest, setSendingRequest] = useState(false);

  const {
    students,
    loading: loadingStudents,
    error: studentsError,
    fetchStudents,
  } = useStudents();

  const {
    reports,
    loading: loadingReports,
    error: reportsError,
    fetchReports,
  } = useReports();

  const { gradesLocked, loadingLock, fetchLockStatus } = useLockStatus();

  // ---------- Token axios setup ----------
  useEffect(() => {
    const token = ctxToken ?? localStorage.getItem("token");
    const hdrs = axiosInstance.defaults.headers as any;
    if (token) {
      hdrs.common = { ...hdrs.common, Authorization: `Bearer ${token}` };
    } else {
      delete hdrs.common["Authorization"];
    }
  }, [ctxToken]);

  // ---------- Sync teacher state ----------
  useEffect(() => {
    if (ctxUser) {
      setTeacher(ctxUser as FEUser);
      try {
        localStorage.setItem("user", JSON.stringify(ctxUser));
      } catch {
        /* ignore storage error */
      }
    }
  }, [ctxUser]);

  if (!teacher) return <p>Vui lòng đăng nhập.</p>;

  // ---------- Request update grade ----------
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
      const payload = { studentId, subject, grade: newScore };
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
      console.error("❌ Lỗi gửi yêu cầu:", err?.response || err);
      alert(err?.response?.data?.message || "Gửi yêu cầu thất bại");
    } finally {
      setSendingRequest(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
      <header>
        {/* header giống cũ: teacher.username/email + trạng thái khóa */}
      </header>

      <nav>{/* tab buttons */}</nav>

      <main>
        {activeTab === "info" && <InfoTab teacher={teacher} />}

        {activeTab === "students" && (
          <StudentsTab
            students={students}
            filterYear={filterYear}
            filterClass={filterClass}
            setFilterYear={setFilterYear}
            setFilterClass={setFilterClass}
            loadingStudents={loadingStudents}
            studentsError={studentsError}
            fetchStudents={fetchStudents}
            gradesLocked={gradesLocked}
            sendingRequest={sendingRequest}
            requestUpdateGrade={requestUpdateGrade}
          />
        )}

        {activeTab === "reports" && (
          <ReportsTab
            reports={reports as IDailyReport[]}
            loadingReports={loadingReports}
            reportsError={reportsError}
            fetchReports={fetchReports}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            gradesLocked={gradesLocked}
            loadingLock={loadingLock}
            fetchLockStatus={fetchLockStatus}
          />
        )}
      </main>
    </div>
  );
}
