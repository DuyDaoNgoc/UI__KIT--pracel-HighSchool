import React, { useState, useEffect } from "react";
import { IGrade, ITuition } from "../../../types/profiles";
import { BarChart3, TrendingUp } from "lucide-react";
import {
  ThemeProvider,
  Typography,
  Card,
  CardContent,
  Box,
} from "@mui/material";
import theme from "../admin/Dashboard/themes/theme";
import config from "../admin/Dashboard/themes/config";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { motion } from "framer-motion";
import axiosInstance from "../../../api/axiosConfig";
import { useSocket } from "../../../Components/settings/hook/IOserver/useSocket";

interface ProfileStatisticsProps {
  grades?: IGrade[];
  tuition?: ITuition | null;
  studentId?: string;
  schoolYear?: string;
}

interface StudentTuition {
  _id: string;
  tuitionId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "unpaid" | "partial" | "paid";
}

// Helper function to compute average from a single grade object
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

export default function ProfileStatistics({
  grades = [],
  tuition,
  studentId,
  schoolYear = "2024-2025",
}: ProfileStatisticsProps) {
  const appTheme = theme(config as any);
  const [studentTuitions, setStudentTuitions] = useState<StudentTuition[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch student tuitions if studentId provided
  useEffect(() => {
    console.log(
      "📌 [ProfileStats] useEffect triggered - studentId:",
      studentId,
    );

    if (studentId) {
      console.log("✅ [ProfileStats] StudentId valid, starting fetch...");
      const fetchTuitions = async () => {
        setLoading(true);
        try {
          console.log(
            "🔍 [ProfileStats] Fetching tuitions for studentId:",
            studentId,
            "Type:",
            typeof studentId,
          );
          const res = await axiosInstance.get<{ data: StudentTuition[] }>(
            `/student-tuition/student/${studentId}`,
          );

          console.log("📦 [ProfileStats] API Response status:", res.status);
          console.log("📦 [ProfileStats] API Response received:", res.data);

          const data = Array.isArray(res.data)
            ? res.data
            : res.data?.data || [];

          console.log(
            "✅ [ProfileStats] Loaded student tuitions:",
            data.length,
            "records",
          );
          console.log("📋 [ProfileStats] Data details:", data);
          if (data.length > 0) {
            console.log(
              "💰 [ProfileStats] First record paidAmount:",
              data[0]?.paidAmount,
            );
          }
          setStudentTuitions(data);
        } catch (err: any) {
          console.error("❌ [ProfileStats] Fetch student tuitions error:", {
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
      console.warn(
        "⚠️ [ProfileStats] No studentId provided - cannot fetch tuitions",
      );
    }
  }, [studentId]);

  // Socket listeners for real-time tuition updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !studentId) {
      console.warn(
        "🔴 [ProfileStats] Socket or studentId missing - socket:",
        !!socket,
        "studentId:",
        studentId,
      );
      return;
    }
    console.log(
      "🟢 [ProfileStats] Setting up socket listeners - studentId:",
      studentId,
      "socket.id:",
      socket.id,
    );

    const onTuitionUpdate = (payload: any) => {
      console.log(
        "🔔 [ProfileStats] Received student-tuition:updated event:",
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
            "🔄 [ProfileStats] Refetched after socket event:",
            data.length,
            "records",
          );
          setStudentTuitions(data);
        } catch (err: any) {
          console.error(
            "❌ [ProfileStats] Refetch after socket event failed:",
            err.message,
          );
        }
      };
      fetchTuitions();
    };

    const onTuitionCreate = (payload: any) => {
      console.log(
        "🔔 [ProfileStats] Received student-tuition:created event:",
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
            "🔄 [ProfileStats] Refetched after socket create event:",
            data.length,
            "records",
          );
          setStudentTuitions(data);
        } catch (err: any) {
          console.error(
            "❌ [ProfileStats] Refetch after socket create event failed:",
            err.message,
          );
        }
      };
      fetchTuitions();
    };

    const onReconnect = () => {
      console.log("🔌 [ProfileStats] Socket reconnected, refetching data");
      const fetchTuitions = async () => {
        try {
          const res = await axiosInstance.get<{ data: StudentTuition[] }>(
            `/student-tuition/student/${studentId}`,
          );
          const data = Array.isArray(res.data)
            ? res.data
            : res.data?.data || [];
          console.log(
            "🔄 [ProfileStats] Refetched after reconnect:",
            data.length,
            "records",
          );
          setStudentTuitions(data);
        } catch (err: any) {
          console.error(
            "❌ [ProfileStats] Refetch after reconnect failed:",
            err.message,
          );
        }
      };
      fetchTuitions();
    };

    const onTuitionDelete = (payload: any) => {
      console.log(
        "🗑️ [ProfileStats] Received student-tuition:deleted event:",
        payload,
      );
      // Remove deleted tuition records from state
      if (payload?.tuitionId) {
        setStudentTuitions((prev) => {
          const filtered = prev.filter(
            (st) => st.tuitionId !== payload.tuitionId,
          );
          console.log(
            `🗑️ [ProfileStats] Removed tuitionId: ${payload.tuitionId} - Remaining: ${filtered.length} records`,
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
            "🔄 [ProfileStats] Refetched after delete event - Final count:",
            data.length,
            "records",
          );
          setStudentTuitions(data);
        } catch (err: any) {
          console.error(
            "❌ [ProfileStats] Refetch after delete failed:",
            err.message,
          );
        }
      };
      setTimeout(() => fetchTuitions(), 300);
    };

    socket.on("student-tuition:updated", onTuitionUpdate);
    socket.on("student-tuition:created", onTuitionCreate);
    socket.on("student-tuition:deleted", onTuitionDelete);
    socket.on("reconnect", onReconnect);
    console.log(
      "✅ [ProfileStats] Socket listeners registered for events: updated, created, deleted, reconnect",
    );

    return () => {
      socket.off("student-tuition:updated", onTuitionUpdate);
      socket.off("student-tuition:created", onTuitionCreate);
      socket.off("student-tuition:deleted", onTuitionDelete);
      socket.off("reconnect", onReconnect);
      console.log("🧹 [ProfileStats] Socket listeners cleaned up");
    };
  }, [socket, studentId]);

  // Polling fallback for tuition updates (every 5 seconds)
  useEffect(() => {
    if (!studentId) return;

    const pollInterval = setInterval(async () => {
      try {
        console.log("⏱️ [ProfileStats] Polling refetch (backup)");
        const res = await axiosInstance.get<{ data: StudentTuition[] }>(
          `/student-tuition/student/${studentId}`,
        );
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setStudentTuitions(data);
      } catch (err: any) {
        console.error("❌ [ProfileStats] Polling failed:", err.message);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [studentId]);

  // Tính thống kê điểm - sử dụng hàm helper để tính điểm từng môn
  const gradeCount = grades.length;

  // Calculate average for each grade using the helper function
  const gradeAverages = grades
    .map((g) => computeAverageFromGrades(g as any))
    .filter((avg): avg is number => avg !== null);

  console.log("[ProfileStats] Grades received:", grades);
  console.log("[ProfileStats] Grade averages calculated:", gradeAverages);
  console.log(
    "[ProfileStats] gradeCount:",
    gradeCount,
    "gradeAverages.length:",
    gradeAverages.length,
  );

  const avgGrade =
    gradeAverages.length > 0
      ? (
          gradeAverages.reduce((a, b) => a + b, 0) / gradeAverages.length
        ).toFixed(2)
      : 0;

  console.log("[ProfileStats] avgGrade:", avgGrade);

  const excellentCount = gradeAverages.filter((score) => score >= 9).length;
  const goodCount = gradeAverages.filter(
    (score) => score >= 8 && score < 9,
  ).length;
  const fairCount = gradeAverages.filter(
    (score) => score >= 7 && score < 8,
  ).length;
  const poorCount = gradeAverages.filter(
    (score) => score >= 5 && score < 7,
  ).length;
  const failCount = gradeAverages.filter((score) => score < 5).length;

  // Tính % học phí - từ studentTuitions hoặc từ tuition prop
  // Filter ra những bản ghi hợp lệ (có studentId) và theo schoolYear
  // Note: Old records may not have schoolYear field - show them for fallback
  console.log(
    "🔍 [ProfileStats] All studentTuitions:",
    studentTuitions.map((st) => ({
      id: st._id,
      schoolYear: st.schoolYear,
      semester: st.semester,
      tuitionId: st.tuitionId,
    })),
  );

  const validStudentTuitions = studentTuitions.filter((st) => {
    // Include records that match schoolYear OR records without schoolYear (old data)
    const hasMatchingYear = st?.schoolYear === schoolYear;
    const hasNoYear = !st?.schoolYear;
    return st && st._id && (hasMatchingYear || hasNoYear);
  });

  let tuitionTotal = 0;
  let tuitionPaid = 0;
  let tuitionRemaining = 0;

  console.log(
    "📊 [ProfileStats] Computing tuition stats - schoolYear:",
    schoolYear,
    "validStudentTuitions.length:",
    validStudentTuitions.length,
  );

  if (validStudentTuitions.length > 0) {
    console.log(
      "✅ [ProfileStats] Using studentTuitions data for schoolYear:",
      schoolYear,
    );
    // Tính tổng từ tất cả StudentTuition records của năm này
    tuitionTotal = validStudentTuitions.reduce((sum, st) => {
      const amount = st.totalAmount || 0;
      console.log("📊 [ProfileStats] Processing tuition record:", {
        id: st._id,
        schoolYear: st.schoolYear || "(no schoolYear - old data)",
        semester: st.semester,
        totalAmount: amount,
      });
      return sum + amount;
    }, 0);
    tuitionPaid = validStudentTuitions.reduce(
      (sum, st) => sum + (st.paidAmount || 0),
      0,
    );
    tuitionRemaining = validStudentTuitions.reduce(
      (sum, st) => sum + (st.remainingAmount || 0),
      0,
    );
    console.log(
      "📊 [ProfileStats] Tuition totals calculated for",
      schoolYear,
      ":",
      {
        tuitionTotal,
        tuitionPaid,
        tuitionRemaining,
      },
    );
  } else {
    // Fallback to tuition prop
    tuitionTotal = tuition?.total ?? 0;
    tuitionPaid = tuition?.paid ?? 0;
    tuitionRemaining = tuition?.remaining ?? 0;
    console.warn(
      "⚠️ [ProfileStats] No studentTuitions for",
      schoolYear,
      "using tuition prop fallback",
    );
  }

  const paidPercent =
    tuitionTotal > 0 ? ((tuitionPaid / tuitionTotal) * 100).toFixed(0) : 0;

  // Chart điểm
  const gradeChartData = [
    { name: "Xuất sắc (9-10)", count: excellentCount, color: "#28a745" },
    { name: "Tốt (8-8.9)", count: goodCount, color: "#17a2b8" },
    { name: "Khá (7-7.9)", count: fairCount, color: "#ffc107" },
    { name: "Yếu (5-6.9)", count: poorCount, color: "#fd7e14" },
    { name: "Kém (<5)", count: failCount, color: "#dc3545" },
  ];

  const gradeChartOptions: ApexOptions = {
    chart: { type: "bar", height: 320, toolbar: { show: false } },
    plotOptions: {
      bar: { borderRadius: 6, horizontal: false, columnWidth: "60%" },
    },
    colors: gradeChartData.map((d) => d.color),
    dataLabels: { enabled: false },
    xaxis: { categories: gradeChartData.map((d) => d.name.split(" ")[0]) },
    tooltip: {
      y: { formatter: (val: number) => val.toString() + " môn" },
    },
    states: {
      hover: { filter: { type: "darken" } },
    },
  };

  const gradeChartSeries = [
    { name: "Số môn", data: gradeChartData.map((d) => d.count) },
  ];

  // Chart học phí
  const tuitionChartOptions: ApexOptions = {
    chart: { type: "pie", height: 320 },
    labels: ["Đã đóng", "Còn nợ"],
    colors: ["#28a745", "#dc3545"],
    legend: { position: "bottom" },
    dataLabels: { formatter: (val: number) => val.toFixed(1) + "%" },
  };

  const tuitionChartSeries = [Number(paidPercent), 100 - Number(paidPercent)];

  return (
    <ThemeProvider theme={appTheme}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{ mb: 3, fontWeight: "bold" }}
        >
          Thống kê học kì {schoolYear}
        </Typography>

        {/* Cards tổng quan */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
            gap: 2,
            mb: 3,
          }}
        >
          <Card sx={{ bgcolor: "#e3f2fd", borderRadius: 2, boxShadow: 1 }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Tổng môn học
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#007bff" }}
              >
                {gradeCount}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: "#fff3e0", borderRadius: 2, boxShadow: 1 }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Điểm TB
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#ffc107" }}
              >
                {avgGrade}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: "#f3e5f5", borderRadius: 2, boxShadow: 1 }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Học phí đã đóng
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#9c27b0" }}
              >
                {paidPercent}%
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: "#e8f5e9", borderRadius: 2, boxShadow: 1 }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                Còn nợ
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#28a745" }}
              >
                {tuitionRemaining.toLocaleString("vi-VN")} VND
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Charts */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          {/* Chart điểm */}
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Phân bố điểm
              </Typography>
              <ReactApexChart
                options={gradeChartOptions}
                series={gradeChartSeries}
                type="bar"
                height={320}
              />
            </CardContent>
          </Card>

          {/* Chart học phí */}
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                Học phí
              </Typography>
              <ReactApexChart
                options={tuitionChartOptions}
                series={tuitionChartSeries}
                type="pie"
                height={320}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <b>Tổng cộng:</b> {tuitionTotal.toLocaleString("vi-VN")} VND
                </Typography>
                <Typography variant="body2">
                  <b>Đã đóng:</b> {tuitionPaid.toLocaleString("vi-VN")} VND
                </Typography>
                <Typography variant="body2">
                  <b>Còn nợ:</b> {tuitionRemaining.toLocaleString("vi-VN")} VND
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Chi tiết điểm */}
        <Card sx={{ mt: 3, borderRadius: 2, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
              Chi tiết xếp loại
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              {gradeChartData.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  <Box
                    sx={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      bgcolor: item.color,
                    }}
                  />
                  <Typography variant="body2">
                    {item.name}: <b>{item.count} môn</b>
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </ThemeProvider>
  );
}
