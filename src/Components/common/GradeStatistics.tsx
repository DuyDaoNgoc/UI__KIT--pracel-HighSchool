import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosConfig";
import { toast } from "react-hot-toast";

interface GradeStats {
  totalStudents: number;
  averageGrade: number;
  excellentCount: number;
  goodCount: number;
  fairCount: number;
  poorCount: number;
  failCount: number;
}

interface Props {
  classId?: string;
  subjectId?: string;
  compact?: boolean;
}

export default function GradeStatistics({
  classId,
  subjectId,
  compact = false,
}: Props) {
  const [stats, setStats] = useState<GradeStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        let url = "/api/grades/statistics";
        const params = new URLSearchParams();

        if (classId) params.append("classId", classId);
        if (subjectId) params.append("subjectId", subjectId);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const res = await axiosInstance.get<{ data: GradeStats }>(url);
        setStats(res.data?.data || null);
      } catch (err) {
        console.error("fetchStats error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [classId, subjectId]);

  if (loading || !stats) {
    return <div className="grade-stats loading">Đang tải...</div>;
  }

  const gradeDistribution = [
    { label: "Xuất sắc (9-10)", count: stats.excellentCount, color: "#10b981" },
    { label: "Giỏi (8-8.9)", count: stats.goodCount, color: "#3b82f6" },
    { label: "Khá (7-7.9)", count: stats.fairCount, color: "#f59e0b" },
    { label: "Trung bình (5-6.9)", count: stats.poorCount, color: "#ef4444" },
    { label: "Yếu (<5)", count: stats.failCount, color: "#991b1b" },
  ];

  if (compact) {
    return (
      <div className="grade-stats compact">
        <div className="stat-summary">
          <div className="stat-item">
            <span className="label">Trung bình:</span>
            <span className="value">{stats.averageGrade.toFixed(2)}/10</span>
          </div>
          <div className="stat-item">
            <span className="label">Tổng HS:</span>
            <span className="value">{stats.totalStudents}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grade-stats">
      <h3>Thống kê điểm</h3>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>Điểm trung bình</h4>
          <p className="stat-value">{stats.averageGrade.toFixed(2)}/10</p>
        </div>
        <div className="stat-card">
          <h4>Tổng học sinh</h4>
          <p className="stat-value">{stats.totalStudents}</p>
        </div>
      </div>

      <div className="grade-distribution">
        <h4>Phân bố điểm</h4>
        <div className="distribution-bars">
          {gradeDistribution.map((item) => (
            <div key={item.label} className="distribution-item">
              <div className="bar-container">
                <div
                  className="bar"
                  style={{
                    width: `${
                      stats.totalStudents > 0
                        ? (item.count / stats.totalStudents) * 100
                        : 0
                    }%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <div className="label-info">
                <span className="label">{item.label}</span>
                <span className="count">
                  {item.count}/{stats.totalStudents}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
