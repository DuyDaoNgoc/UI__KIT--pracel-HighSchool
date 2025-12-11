// src/pages/Profile/TeacherProfile/ReportsTab.tsx
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { toast } from "react-hot-toast";
import type { IDailyReport, IStudent } from "./types";

interface Props {
  classes?: any[]; // teacher classes with students array
  teacherId?: string;
}

interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
}

export default function ReportsTab({ classes = [], teacherId }: Props) {
  const [reportDate, setReportDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [reports, setReports] = useState<IDailyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const [selectedClass, setSelectedClass] = useState<string | "">(
    classes?.[0]?.classCode ?? "",
  );
  const students = useMemo(() => {
    if (!selectedClass) return [] as IStudent[];
    const cls = (classes || []).find((c: any) => c.classCode === selectedClass);
    return cls?.students || [];
  }, [classes, selectedClass]);

  const [selectedStudent, setSelectedStudent] = useState<string | "">("");
  const [status, setStatus] = useState<"good" | "warning" | "bad">("good");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async (date: string) => {
    try {
      setLoadingReports(true);
      setReportsError(null);
      const res = await axiosInstance.get<ApiResponse<IDailyReport[]>>(
        `/reports?date=${date}&teacherId=${teacherId || ""}`,
      );
      const data = res.data?.data || res.data || [];
      setReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("fetchReports error:", err);
      setReportsError(err?.message || "Lỗi tải báo cáo");
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports(reportDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportDate, teacherId]);

  const createReport = async () => {
    if (!selectedStudent) return toast.error("Vui lòng chọn học sinh");
    try {
      setSubmitting(true);
      const payload = {
        date: reportDate,
        studentId: selectedStudent,
        status,
        notes,
        teacherId,
      };
      const res = await axiosInstance.post<ApiResponse<IDailyReport>>(
        "/reports",
        payload,
      );
      if (res.data?.success) {
        toast.success("Báo cáo đã gửi");
        setNotes("");
        setSelectedStudent("");
        fetchReports(reportDate);
      } else {
        toast.error(res.data?.message || "Gửi báo cáo thất bại");
      }
    } catch (err: any) {
      console.error("createReport error:", err);
      toast.error(err?.message || "Lỗi gửi báo cáo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
            onClick={() => fetchReports(reportDate)}
            style={{ padding: "8px 12px", borderRadius: 6 }}
          >
            Tải báo cáo
          </button>
        </div>
      </div>

      {/* Create report form */}
      <div
        style={{
          border: "1px solid #eee",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <h4 style={{ margin: "0 0 8px 0" }}>Tạo báo cáo cho học sinh</h4>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Chọn lớp</option>
            {(classes || []).map((c: any) => (
              <option key={c.classCode} value={c.classCode}>
                {c.classCode} - {c.className || c.grade + c.classLetter}
              </option>
            ))}
          </select>

          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">Chọn học sinh</option>
            {students.map((s: any) => (
              <option key={s._id} value={s._id}>
                {s.name || s.username}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="good">Tốt</option>
            <option value="warning">Cần chú ý</option>
            <option value="bad">Kém</option>
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú / mô tả"
            style={{ width: "100%", minHeight: 80 }}
          />
        </div>
        <div>
          <button
            onClick={createReport}
            disabled={submitting}
            style={{ padding: "8px 12px", borderRadius: 6 }}
          >
            {submitting ? "Đang gửi..." : "Gửi báo cáo"}
          </button>
        </div>
      </div>

      {/* Reports list */}
      <div>
        <h4>Báo cáo ngày {reportDate}</h4>
        {loadingReports ? (
          <div>Đang tải...</div>
        ) : reportsError ? (
          <div style={{ color: "red" }}>{reportsError}</div>
        ) : reports.length === 0 ? (
          <div>Chưa có báo cáo</div>
        ) : (
          <ul>
            {reports.map((r, idx) => (
              <li
                key={idx}
                style={{ borderBottom: "1px solid #eee", padding: 8 }}
              >
                <div>
                  <strong>
                    {(r as any).studentName || (r as any).studentId || r.date}
                  </strong>{" "}
                  — {(r as any).status || (r as any).summary || "-"}
                </div>
                {(r as any).notes && (
                  <div style={{ color: "#444" }}>{(r as any).notes}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
