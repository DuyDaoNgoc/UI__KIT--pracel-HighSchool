// src/pages/Profile/TeacherProfile/ReportsTab.tsx
import React, { useState } from "react";
import type { IDailyReport } from "./types";

interface Props {
  reports: IDailyReport[];
  loadingReports: boolean;
  reportsError: string | null;
  fetchReports: (date: string) => void;
}

export default function ReportsTab({
  reports,
  loadingReports,
  reportsError,
  fetchReports,
}: Props) {
  const [reportDate, setReportDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

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
              style={{ padding: 12, borderRadius: 8, border: "1px solid #eee" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>{r.date}</strong> — {r.summary}
                </div>
                <div style={{ color: "#666" }}>
                  {r.updatesRequested} yêu cầu
                </div>
              </div>
              {r.notes && (
                <div style={{ marginTop: 6, color: "#444" }}>{r.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
