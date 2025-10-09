// src/pages/Profile/TeacherProfile/hooks.ts
import axiosInstance from "../../../api/axiosConfig";
import { useState } from "react";
import type { IStudent, IDailyReport } from "./types";

export function useStudents() {
  const [students, setStudents] = useState<IStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchStudents() {
    setLoading(true);
    setError(null);
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
      setStudents([]);
      setError(
        err?.response?.data?.message || "Không thể lấy danh sách học sinh",
      );
    } finally {
      setLoading(false);
    }
  }

  return { students, loading, error, fetchStudents, setStudents };
}

export function useReports() {
  const [reports, setReports] = useState<IDailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchReports(date: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get<IDailyReport[]>(
        `/api/teachers/reports?date=${date}`,
      );
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setReports([]);
      setError(err?.response?.data?.message || "Không thể tải báo cáo");
    } finally {
      setLoading(false);
    }
  }

  return { reports, loading, error, fetchReports, setReports };
}

export function useLockStatus() {
  const [gradesLocked, setGradesLocked] = useState<boolean | null>(null);
  const [loadingLock, setLoadingLock] = useState(false);

  async function fetchLockStatus() {
    setLoadingLock(true);
    try {
      let res = await axiosInstance.get<{ locked: boolean }>(
        "/api/admin/grades/status",
      );
      setGradesLocked(Boolean(res?.data?.locked));
    } catch {
      try {
        const res = await axiosInstance.get<{ locked: boolean }>(
          "/api/grades/status",
        );
        setGradesLocked(Boolean(res?.data?.locked));
      } catch {
        setGradesLocked(null);
      }
    } finally {
      setLoadingLock(false);
    }
  }

  return { gradesLocked, loadingLock, fetchLockStatus, setGradesLocked };
}
