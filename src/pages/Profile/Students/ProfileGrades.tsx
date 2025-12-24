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

export default function ProfileGrades({ grades }: { grades: IGrade[] }) {
  return (
    <div className="profile__card">
      <h2>Điểm số & Hạnh kiểm</h2>
      {!grades || grades.length === 0 ? (
        <p>Không có dữ liệu</p>
      ) : (
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
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
