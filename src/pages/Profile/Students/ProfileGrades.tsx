import React from "react";
import { IGrade } from "../../../types/profiles";

const GRADE_TYPES = [
  { key: "oral", label: "Miệng", short: "M" },
  { key: "test15", label: "15 phút", short: "15p" },
  { key: "test1period", label: "1 tiết", short: "1t" },
  { key: "midterm", label: "Giữa kì", short: "GK" },
  { key: "semester1", label: "HK 1", short: "HK1" },
  { key: "semester2", label: "HK 2", short: "HK2" },
  { key: "final", label: "Cuối kì", short: "CK" },
];

function computeAverageFromGrades(g: any) {
  if (!g) return null;
  if (g.averageScore !== undefined) return g.averageScore;
  if (Array.isArray(g.grades) && g.grades.length > 0) {
    const vals = g.grades
      .map((x: any) => Number(x.score))
      .filter((n: number) => !isNaN(n));
    if (vals.length === 0) return null;
    return (
      Math.round(
        (vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10,
      ) / 10
    );
  }
  if (g.score !== undefined) return Number(g.score);
  return null;
}

// Hàm tính xếp loại học lực theo điểm trung bình
function getGradeRating(avg: number | null) {
  if (avg === null) return { label: "-", color: "#999" };
  if (avg >= 9) return { label: "Xuất sắc", color: "#d4af37" }; // Vàng
  if (avg >= 8) return { label: "Tốt", color: "#2e7d32" }; // Xanh
  if (avg >= 7) return { label: "Khá", color: "#1976d2" }; // Xanh dương
  if (avg >= 5) return { label: "Yếu", color: "#f57c00" }; // Cam
  return { label: "Kém", color: "#c62828" }; // Đỏ
}

export default function ProfileGrades({ grades }: { grades: IGrade[] }) {
  // Tính tổng điểm trung bình tất cả các môn
  const allAverages = grades
    .map((g) => computeAverageFromGrades(g as any))
    .filter((avg): avg is number => avg !== null);

  const overallAverage =
    allAverages.length > 0
      ? Math.round(
          (allAverages.reduce((a, b) => a + b, 0) / allAverages.length) * 10,
        ) / 10
      : null;

  const overallRating = getGradeRating(overallAverage);

  return (
    <div className="profile__card">
      <h2>Điểm số & Hạnh kiểm</h2>
      {!grades || grades.length === 0 ? (
        <p>Không có dữ liệu</p>
      ) : (
        <>
          {/* Summary Card */}
          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}
              >
                Điểm TB tất cả môn
              </div>
              <div
                style={{ fontSize: "24px", fontWeight: 700, color: "#1976d2" }}
              >
                {overallAverage !== null ? overallAverage : "-"}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}
              >
                Xếp loại
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: overallRating.color,
                }}
              >
                {overallRating.label}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}
              >
                Số môn
              </div>
              <div
                style={{ fontSize: "24px", fontWeight: 700, color: "#388e3c" }}
              >
                {grades.length}
              </div>
            </div>
          </div>

          {/* Grades Table */}
          <div className="grades-table-wrap">
            <table className="profile__table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Môn học</th>
                  {GRADE_TYPES.map((gt) => (
                    <th key={gt.key}>{gt.short}</th>
                  ))}
                  <th>Tổng</th>
                  <th>%</th>
                  <th>Kết Quả</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g, idx) => {
                  const avg = computeAverageFromGrades(g as any);
                  const percent =
                    avg !== null ? `${Math.round((avg as number) * 10)}%` : "-";
                  const result =
                    avg === null ? "-" : avg >= 5 ? "Đạt" : "Không đạt";
                  // Build quick lookup for grade types
                  const gradeMap: Record<string, number> = {};
                  if ((g as any).grades && Array.isArray((g as any).grades)) {
                    for (const ge of (g as any).grades) {
                      if (ge && ge.type) gradeMap[ge.type] = Number(ge.score);
                    }
                  }

                  return (
                    <tr key={g.subject + idx}>
                      <td>{idx + 1}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{g.subject}</td>
                      {GRADE_TYPES.map((gt) => (
                        <td key={gt.key} style={{ textAlign: "center" }}>
                          {gradeMap[gt.key] !== undefined
                            ? gradeMap[gt.key]
                            : "-"}
                        </td>
                      ))}
                      <td style={{ textAlign: "center", fontWeight: 600 }}>
                        {avg !== null ? avg : "-"}
                      </td>
                      <td style={{ textAlign: "center" }}>{percent}</td>
                      <td style={{ textAlign: "center" }}>
                        {result === "-" ? (
                          "-"
                        ) : result === "Đạt" ? (
                          <span style={{ color: "#2e7d32", fontWeight: 600 }}>
                            {result}
                          </span>
                        ) : (
                          <span style={{ color: "#c62828", fontWeight: 600 }}>
                            {result}
                          </span>
                        )}
                      </td>
                      <td>
                        {new Date(
                          (g as any).createdAt || Date.now(),
                        ).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
                {/* Hàng tổng cộng */}
                <tr
                  style={{
                    backgroundColor: "#f0f0f0",
                    fontWeight: 600,
                    borderTop: "2px solid #999",
                  }}
                >
                  <td
                    colSpan={2}
                    style={{ textAlign: "right", paddingRight: "16px" }}
                  >
                    <strong>Tổng cộng:</strong>
                  </td>
                  {GRADE_TYPES.map((gt) => (
                    <td key={gt.key} style={{ textAlign: "center" }}>
                      -
                    </td>
                  ))}
                  <td
                    style={{
                      textAlign: "center",
                      color: "#1976d2",
                      fontSize: "16px",
                    }}
                  >
                    {overallAverage !== null ? overallAverage : "-"}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      color: overallRating.color,
                      fontSize: "16px",
                    }}
                  >
                    {overallAverage !== null
                      ? `${Math.round(overallAverage * 10)}%`
                      : "-"}
                  </td>
                  <td
                    style={{
                      textAlign: "center",
                      color: overallRating.color,
                      fontSize: "16px",
                    }}
                  >
                    <strong>{overallRating.label}</strong>
                  </td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
