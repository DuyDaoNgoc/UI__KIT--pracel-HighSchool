import React from "react";
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

interface ProfileStatisticsProps {
  grades?: IGrade[];
  tuition?: ITuition | null;
  schoolYear?: string;
}

export default function ProfileStatistics({
  grades = [],
  tuition,
  schoolYear = "2024-2025",
}: ProfileStatisticsProps) {
  const appTheme = theme(config as any);

  // Tính thống kê điểm
  const gradeCount = grades.length;
  const avgGrade =
    gradeCount > 0
      ? (grades.reduce((sum, g) => sum + g.score, 0) / gradeCount).toFixed(2)
      : 0;

  const excellentCount = grades.filter((g) => g.score >= 9).length;
  const goodCount = grades.filter((g) => g.score >= 8 && g.score < 9).length;
  const fairCount = grades.filter((g) => g.score >= 7 && g.score < 8).length;
  const poorCount = grades.filter((g) => g.score >= 5 && g.score < 7).length;
  const failCount = grades.filter((g) => g.score < 5).length;

  // Tính % học phí
  const tuitionTotal = tuition?.total ?? 0;
  const tuitionPaid = tuition?.paid ?? 0;
  const tuitionRemaining = tuition?.remaining ?? 0;
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
