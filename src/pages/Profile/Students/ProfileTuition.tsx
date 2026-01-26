import React, { useState, useEffect } from "react";
import { ITuition } from "../../../types/profiles";
import axiosInstance from "../../../api/axiosConfig";
import { useSocket } from "../../../Components/settings/hook/IOserver/useSocket";

interface StudentTuition {
  _id: string;
  tuitionId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "unpaid" | "partial" | "paid";
  notes?: string;
}

export default function ProfileTuition({
  tuition,
  studentId,
}: {
  tuition: ITuition | null;
  studentId?: string;
}) {
  const [studentTuitions, setStudentTuitions] = useState<StudentTuition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("");
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // Fetch student tuitions if studentId provided
  useEffect(() => {
    if (studentId) {
      const fetchTuitions = async () => {
        setLoading(true);
        try {
          console.log(
            "🔍 [ProfileTuition] Fetching tuitions for studentId:",
            studentId,
            "Type:",
            typeof studentId,
          );
          const res = await axiosInstance.get<{ data: StudentTuition[] }>(
            `/student-tuition/student/${studentId}`,
          );

          console.log("📦 [ProfileTuition] API Response status:", res.status);
          console.log("📦 [ProfileTuition] API Response received:", res.data);

          const data = Array.isArray(res.data)
            ? res.data
            : res.data?.data || [];

          console.log(
            "✅ [ProfileTuition] Loaded student tuitions:",
            data.length,
            "records",
          );
          console.log("📋 [ProfileTuition] Data details:", data);

          if (data.length === 0) {
            console.warn(
              "⚠️ [ProfileTuition] No tuitions found. This might mean:",
            );
            console.warn(
              "  1. No StudentTuition records exist for this student",
            );
            console.warn("  2. Admin hasn't generated tuition records yet");
            console.warn("  3. StudentId format mismatch in database");
          }

          setStudentTuitions(data);
          // Extract unique school years from tuition records
          const years = Array.from(
            new Set(
              data
                .filter((st) => st?.schoolYear)
                .map((st) => st.schoolYear as string),
            ),
          ).sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)
          setAvailableYears(years);
          // Set default to first available year or current year
          const defaultYear = years.length > 0 ? years[0] : "2024-2025";
          setSelectedSchoolYear(defaultYear);
          console.log(
            "✅ [ProfileTuition] Loaded student tuitions:",
            data.length,
            "records, Available years:",
            years,
          );
          if (data.length > 0) {
            console.log("💰 [ProfileTuition] First record:", {
              studentId: data[0]?.studentId,
              totalAmount: data[0]?.totalAmount,
              paidAmount: data[0]?.paidAmount,
              schoolYear: data[0]?.schoolYear,
              semester: data[0]?.semester,
            });
          }
        } catch (err: any) {
          console.error("❌ [ProfileTuition] Fetch error:", {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
            url: err.config?.url,
            studentId,
          });
        } finally {
          setLoading(false);
        }
      };
      fetchTuitions();
    } else {
      console.warn("⚠️ [ProfileTuition] No studentId provided");
    }
  }, [studentId]);

  // Socket listeners for real-time tuition updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !studentId) {
      console.warn(
        "🔴 [ProfileTuition] Socket or studentId missing - socket:",
        !!socket,
        "studentId:",
        studentId,
      );
      return;
    }
    console.log(
      "🟢 [ProfileTuition] Setting up socket listeners - studentId:",
      studentId,
      "socket.id:",
      socket.id,
    );

    const onTuitionUpdate = (payload: any) => {
      console.log(
        "🔔 [ProfileTuition] Received student-tuition:updated event:",
        payload,
      );
      // Refetch data when tuition updates
      const fetchTuitions = async () => {
        try {
          const res = await axiosInstance.get<{ data: StudentTuition[] }>(
            `/student-tuition/student/${studentId}`,
          );
          const data = Array.isArray(res.data)
            ? res.data
            : res.data?.data || [];
          console.log(
            "🔄 [ProfileTuition] Refetched after socket event:",
            data.length,
            "records",
          );
          if (data.length > 0) {
            console.log("💰 [ProfileTuition] First record:", {
              paidAmount: data[0]?.paidAmount,
              schoolYear: data[0]?.schoolYear,
              semester: data[0]?.semester,
            });
          }
          setStudentTuitions(data);
          // Update available years
          const years = Array.from(
            new Set(
              data
                .filter((st) => st?.schoolYear)
                .map((st) => st.schoolYear as string),
            ),
          ).sort((a, b) => b.localeCompare(a));
          setAvailableYears(years);
        } catch (err: any) {
          console.error(
            "❌ [ProfileTuition] Refetch after socket event failed:",
            err.message,
          );
        }
      };
      fetchTuitions();
    };

    const onTuitionCreate = (payload: any) => {
      console.log(
        "🔔 [ProfileTuition] Received student-tuition:created event:",
        payload,
      );
      // Refetch data when new tuition is created
      const fetchTuitions = async () => {
        try {
          const res = await axiosInstance.get<{ data: StudentTuition[] }>(
            `/student-tuition/student/${studentId}`,
          );
          const data = Array.isArray(res.data)
            ? res.data
            : res.data?.data || [];
          console.log(
            "🔄 [ProfileTuition] Refetched after socket create event:",
            data.length,
            "records",
          );
          setStudentTuitions(data);
          // Update available years
          const years = Array.from(
            new Set(
              data
                .filter((st) => st?.schoolYear)
                .map((st) => st.schoolYear as string),
            ),
          ).sort((a, b) => b.localeCompare(a));
          setAvailableYears(years);
        } catch (err: any) {
          console.error(
            "❌ [ProfileTuition] Refetch after socket create event failed:",
            err.message,
          );
        }
      };
      fetchTuitions();
    };

    const onTuitionDelete = (payload: any) => {
      console.log(
        "🗑️ [ProfileTuition] Received student-tuition:deleted event:",
        payload,
      );
      // Remove deleted tuition records from state
      if (payload?.tuitionId) {
        setStudentTuitions((prev) => {
          const filtered = prev.filter(
            (st) => st.tuitionId !== payload.tuitionId,
          );
          // Recalculate available years after deletion
          const remainingYears = Array.from(
            new Set(
              filtered
                .filter((st) => st?.schoolYear)
                .map((st) => st.schoolYear as string),
            ),
          ).sort((a, b) => b.localeCompare(a));
          setAvailableYears(remainingYears);
          console.log(
            "📊 [ProfileTuition] Years after delete:",
            remainingYears,
          );
          console.log(
            "🗑️ [ProfileTuition] Removed tuitionId:",
            payload.tuitionId,
            "- Remaining:",
            filtered.length,
          );
          return filtered;
        });
      }
      // Refetch to ensure complete sync
      const fetchTuitions = async () => {
        try {
          const res = await axiosInstance.get<{ data: StudentTuition[] }>(
            `/student-tuition/student/${studentId}`,
          );
          const data = Array.isArray(res.data)
            ? res.data
            : res.data?.data || [];
          console.log(
            "🔄 [ProfileTuition] Refetch after delete complete:",
            data.length,
            "records",
          );
          setStudentTuitions(data);
          const years = Array.from(
            new Set(
              data
                .filter((st) => st?.schoolYear)
                .map((st) => st.schoolYear as string),
            ),
          ).sort((a, b) => b.localeCompare(a));
          setAvailableYears(years);
        } catch (err: any) {
          console.error(
            "❌ [ProfileTuition] Refetch after delete failed:",
            err.message,
          );
        }
      };
      setTimeout(() => fetchTuitions(), 300);
    };

    const onReconnect = () => {
      console.log("🔌 [ProfileTuition] Socket reconnected, refetching data");
      const fetchTuitions = async () => {
        try {
          const res = await axiosInstance.get<{ data: StudentTuition[] }>(
            `/student-tuition/student/${studentId}`,
          );
          const data = Array.isArray(res.data)
            ? res.data
            : res.data?.data || [];
          console.log(
            "🔄 [ProfileTuition] Refetched after reconnect:",
            data.length,
            "records",
          );
          setStudentTuitions(data);
        } catch (err: any) {
          console.error(
            "❌ [ProfileTuition] Refetch after reconnect failed:",
            err.message,
          );
        }
      };
      fetchTuitions();
    };

    socket.on("student-tuition:updated", onTuitionUpdate);
    socket.on("student-tuition:created", onTuitionCreate);
    socket.on("student-tuition:deleted", onTuitionDelete);
    socket.on("reconnect", onReconnect);
    console.log(
      "✅ [ProfileTuition] Socket listeners registered for events: updated, created, deleted, reconnect",
    );

    return () => {
      socket.off("student-tuition:updated", onTuitionUpdate);
      socket.off("student-tuition:created", onTuitionCreate);
      socket.off("student-tuition:deleted", onTuitionDelete);
      socket.off("reconnect", onReconnect);
      console.log("🧹 [ProfileTuition] Socket listeners cleaned up");
    };
  }, [socket, studentId]);

  // Polling fallback for tuition updates (every 5 seconds)
  useEffect(() => {
    if (!studentId) return;

    const pollInterval = setInterval(async () => {
      try {
        console.log("⏱️ [ProfileTuition] Polling refetch (backup)");
        const res = await axiosInstance.get<{ data: StudentTuition[] }>(
          `/student-tuition/student/${studentId}`,
        );
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setStudentTuitions(data);
      } catch (err: any) {
        console.error("❌ [ProfileTuition] Polling failed:", err.message);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [studentId]);

  // Calculate totals from studentTuitions or tuition prop
  let totalAmount = 0;
  let paidAmount = 0;
  let remainingAmount = 0;

  // Filter tuitions by selected schoolYear
  // Note: Include records without schoolYear field (old data) for backward compatibility
  const filteredStudentTuitions = studentTuitions.filter((st) => {
    const hasMatchingYear = st?.schoolYear === selectedSchoolYear;
    const hasNoYear = !st?.schoolYear;
    return st && st._id && (hasMatchingYear || hasNoYear);
  });

  if (filteredStudentTuitions.length > 0) {
    totalAmount = filteredStudentTuitions.reduce(
      (sum, st) => sum + st.totalAmount,
      0,
    );
    paidAmount = filteredStudentTuitions.reduce(
      (sum, st) => sum + st.paidAmount,
      0,
    );
    remainingAmount = filteredStudentTuitions.reduce(
      (sum, st) => sum + st.remainingAmount,
      0,
    );
    console.log(
      "📊 [ProfileTuition] Filtered tuitions for",
      selectedSchoolYear,
      ":",
      filteredStudentTuitions.length,
      "records",
      { totalAmount, paidAmount, remainingAmount },
    );
  } else {
    totalAmount = tuition?.total ?? 0;
    paidAmount = tuition?.paid ?? 0;
    remainingAmount = tuition?.remaining ?? 0;
  }

  if (loading) {
    return (
      <div className="profile__card">
        <h2>Học phí</h2>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="profile__card">
      <h2> Học phí</h2>

      {/* SchoolYear Selector */}
      {availableYears.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Chọn năm học:
          </label>
          <select
            value={selectedSchoolYear}
            onChange={(e) => setSelectedSchoolYear(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      )}

      {totalAmount > 0 || filteredStudentTuitions.length > 0 ? (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                padding: "12px",
                backgroundColor: "#e3f2fd",
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <p
                style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}
              >
                Tổng nợ
              </p>
              <p
                style={{
                  margin: "0",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#1976d2",
                }}
              >
                {totalAmount.toLocaleString("vi-VN")} VND
              </p>
            </div>
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f3e5f5",
                borderRadius: "6px",
                textAlign: "center",
              }}
            >
              <p
                style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}
              >
                Đã đóng
              </p>
              <p
                style={{
                  margin: "0",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#7b1fa2",
                }}
              >
                {paidAmount.toLocaleString("vi-VN")} VND
              </p>
            </div>
          </div>

          <div
            style={{
              padding: "12px",
              backgroundColor: "#fff3e0",
              borderRadius: "6px",
              marginBottom: "15px",
            }}
          >
            <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}>
              Còn nợ
            </p>
            <p
              style={{
                margin: "0",
                fontSize: "18px",
                fontWeight: "bold",
                color: "#e65100",
              }}
            >
              {remainingAmount.toLocaleString("vi-VN")} VND
            </p>
          </div>

          {filteredStudentTuitions.length > 0 && (
            <div>
              <h3 style={{ marginTop: "20px", marginBottom: "10px" }}>
                Chi tiết học phí - {selectedSchoolYear}
              </h3>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#f5f5f5",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    <th style={{ padding: "8px", textAlign: "left" }}>
                      Kì học
                    </th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Tổng</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>
                      Đã trả
                    </th>
                    <th style={{ padding: "8px", textAlign: "right" }}>
                      Còn nợ
                    </th>
                    <th style={{ padding: "8px", textAlign: "center" }}>
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudentTuitions.map((st, idx) => (
                    <tr key={st._id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "8px" }}>
                        Kì {st.semester || idx + 1}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        {st.totalAmount.toLocaleString("vi-VN")} VND
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          textAlign: "right",
                          color: "#2e7d32",
                        }}
                      >
                        {st.paidAmount.toLocaleString("vi-VN")} VND
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          textAlign: "right",
                          color: st.remainingAmount > 0 ? "#d32f2f" : "#2e7d32",
                        }}
                      >
                        {st.remainingAmount.toLocaleString("vi-VN")} VND
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            backgroundColor:
                              st.status === "paid"
                                ? "#c8e6c9"
                                : st.status === "partial"
                                  ? "#fff9c4"
                                  : "#ffcdd2",
                            color:
                              st.status === "paid"
                                ? "#1b5e20"
                                : st.status === "partial"
                                  ? "#f57f17"
                                  : "#b71c1c",
                          }}
                        >
                          {st.status === "paid"
                            ? "✅ Đã trả"
                            : st.status === "partial"
                              ? "⚠️ Trả một phần"
                              : "❌ Chưa trả"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p>Không có dữ liệu</p>
      )}
    </div>
  );
}
