// src/pages/Profile/admin/Dashboard/AdminDashboard.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  ThemeProvider,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  TextField,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import theme from "./themes/theme";
import config from "./themes/config";
import { motion } from "framer-motion";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

import { get } from "../../../../api/axiosConfig";
import { IClass } from "../../../../types/class";

interface IStudent {
  _id: string;
  name: string;
}

interface ITeacher {
  _id: string;
  name: string;
}

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
}

interface ChartDataItem {
  name: string;
  so_luong: number;
}

const AdminDashboard: React.FC = () => {
  const appTheme = theme(config as any);

  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
  });

  const [studentsData, setStudentsData] = useState<IStudent[]>([]);
  const [teachersData, setTeachersData] = useState<ITeacher[]>([]);
  const [classesData, setClassesData] = useState<IClass[]>([]);

  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [metric, setMetric] = useState<"counts" | "tuition" | "scores">(
    "counts",
  );
  const [yearA, setYearA] = useState<number>(new Date().getFullYear());
  const [yearB, setYearB] = useState<number>(new Date().getFullYear() - 1);
  const [seriesCompare, setSeriesCompare] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<
    "all" | "students" | "teachers" | "classes"
  >("all");

  // per-year state
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [studentsByYear, setStudentsByYear] = useState<Record<string, number>>(
    {},
  );
  const [classesByYear, setClassesByYear] = useState<Record<string, number>>(
    {},
  );
  const [teachersByYear, setTeachersByYear] = useState<Record<string, number>>(
    {},
  );

  // ===== FETCH DATA =====
  const fetchData = async () => {
    try {
      const [students, teachers, classesRes] = await Promise.all([
        get<IStudent[]>("/admin/students"),
        get<ITeacher[]>("/admin/teachers"),
        // classes endpoint may return { success, data } or an array — use any to avoid TS errors
        get<any>("/classes"),
      ]);

      console.log("📌 Students:", students);
      console.log("📌 Teachers:", teachers);
      console.log("📌 Classes:", classesRes);

      // FIX CHUẨN — chỉ lấy mảng đúng
      let classesArray: IClass[] = [];

      if (Array.isArray(classesRes)) {
        classesArray = classesRes;
      } else if (Array.isArray(classesRes?.data)) {
        classesArray = classesRes.data;
      } else {
        console.warn("⚠️ /classes không trả về mảng");
      }

      setStudentsData(students || []);
      setTeachersData(teachers || []);
      setClassesData(classesArray || []);

      // ===== Per-year aggregates =====
      const yearsSet = new Set<string>();
      // students may have schoolYear
      (students || []).forEach((s: any) => {
        if (s.schoolYear) yearsSet.add(String(s.schoolYear));
      });
      // classes have schoolYear
      (classesArray || []).forEach((c: any) => {
        if (c.schoolYear) yearsSet.add(String(c.schoolYear));
      });
      // teachers have schoolYear
      (teachers || []).forEach((t: any) => {
        if (t.schoolYear) yearsSet.add(String(t.schoolYear));
      });

      const availableYears = Array.from(yearsSet).sort(
        (a, b) => Number(b) - Number(a),
      );
      // compute maps
      const studentsByYear: Record<string, number> = {};
      const classesByYear: Record<string, number> = {};
      const teachersByYear: Record<string, number> = {};

      availableYears.forEach((y) => {
        studentsByYear[y] = (students || []).filter(
          (s: any) => String(s.schoolYear) === y,
        ).length;
        classesByYear[y] = (classesArray || []).filter(
          (c: any) => String(c.schoolYear) === y,
        ).length;
        // count teachers by schoolYear
        teachersByYear[y] = (teachers || []).filter((t: any) => {
          return String(t.schoolYear) === y;
        }).length;
      });

      // attach to local state via stats (augment)
      setStats((prev) => ({
        ...prev,
        // not overwriting totals
      }));

      // store per-year data in component state for UI usage
      setAvailableYears(availableYears);
      setStudentsByYear(studentsByYear);
      setClassesByYear(classesByYear);
      setTeachersByYear(teachersByYear);
      // default selected year: use current year if present, otherwise the first available
      const defaultYear = String(new Date().getFullYear());
      setSelectedYear(
        availableYears.includes(defaultYear)
          ? defaultYear
          : (availableYears[0] ?? null),
      );

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classesArray.length,
      });

      setChartData([
        { name: "Học sinh", so_luong: students.length },
        { name: "Giáo viên", so_luong: teachers.length },
        { name: "Lớp học", so_luong: classesArray.length },
      ]);
    } catch (err) {
      console.error("❌ Lỗi tải dữ liệu thống kê:", err);
    }
  };

  // Build a wider, user-friendly list of years to choose from.
  // Combines years present in data plus a generated recent range
  const combinedYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    // determine minimum present year from data (fallback to currentYear - 5)
    const minPresent =
      availableYears && availableYears.length
        ? Math.min(...availableYears.map((y) => Number(y)))
        : currentYear - 5;

    const start = Math.min(minPresent, currentYear - 5);
    const yearsRange: string[] = [];
    for (let y = currentYear; y >= start; y--) yearsRange.push(String(y));

    const merged = Array.from(
      new Set([...yearsRange, ...(availableYears || [])]),
    );
    merged.sort((a, b) => Number(b) - Number(a));
    return merged;
  }, [availableYears]);

  // Fetch statistics for tuition or scores per month for a given year
  const fetchYearlyMetric = async (y: number, m: typeof metric) => {
    try {
      if (m === "tuition") {
        const res = await get<{ year: number; months: number[] }>(
          `/admin/stats/tuition?year=${y}`,
        );
        return res?.months ?? Array(12).fill(0);
      }

      if (m === "scores") {
        const res = await get<{ year: number; monthsTotal: number[] }>(
          `/admin/stats/scores?year=${y}`,
        );
        return res?.monthsTotal ?? Array(12).fill(0);
      }

      return [];
    } catch (err) {
      console.error("fetchYearlyMetric error:", err);
      return Array(12).fill(0);
    }
  };

  // ===== Khởi chạy lần đầu =====
  useEffect(() => {
    fetchData();
  }, []);

  // when metric or years change, fetch compare series
  useEffect(() => {
    const loadCompare = async () => {
      if (metric === "counts") {
        // keep existing behavior
        setSeriesCompare([]);
        return;
      }

      const [a, b] = await Promise.all([
        fetchYearlyMetric(yearA, metric),
        fetchYearlyMetric(yearB, metric),
      ]);

      setSeriesCompare([
        { name: String(yearA), data: a },
        { name: String(yearB), data: b },
      ]);
    };
    loadCompare();
  }, [metric, yearA, yearB]);

  // ===== Cập nhật chart khi đổi chế độ xem =====
  useEffect(() => {
    const baseData: ChartDataItem[] = [
      { name: "Học sinh", so_luong: studentsData.length },
      { name: "Giáo viên", so_luong: teachersData.length },
      { name: "Lớp học", so_luong: classesData.length },
    ];

    const viewMap: Record<typeof viewMode, string> = {
      all: "",
      students: "Học sinh",
      teachers: "Giáo viên",
      classes: "Lớp học",
    };

    const filteredData =
      viewMode === "all"
        ? baseData
        : baseData.filter((d) => d.name === viewMap[viewMode]);

    setChartData(filteredData);
  }, [viewMode, studentsData, teachersData, classesData]);

  const monthCategories = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const apexOptions: ApexOptions =
    metric === "counts"
      ? {
          chart: { type: "bar", height: 350, toolbar: { show: true } },
          plotOptions: {
            bar: { borderRadius: 8, horizontal: false, columnWidth: "50%" },
          },
          dataLabels: { enabled: false },
          xaxis: { categories: chartData.map((d) => d.name) },
          tooltip: { y: { formatter: (val: number) => val.toString() } },
        }
      : {
          chart: { type: "area", height: 350, toolbar: { show: true } },
          dataLabels: { enabled: false },
          stroke: { curve: "smooth" },
          xaxis: { categories: monthCategories },
          tooltip: { y: { formatter: (val: number) => val.toString() } },
        };

  const apexSeries =
    metric === "counts"
      ? [{ name: "Số lượng", data: chartData.map((d) => d.so_luong) }]
      : // ensure we always pass a valid series array to ApexCharts
        seriesCompare && seriesCompare.length > 0
        ? seriesCompare
        : [
            { name: String(yearA), data: Array(12).fill(0) },
            { name: String(yearB), data: Array(12).fill(0) },
          ];

  const viewModes: {
    label: string;
    mode: "all" | "students" | "teachers" | "classes";
  }[] = [
    { label: "Tất cả", mode: "all" },
    { label: "Học sinh", mode: "students" },
    { label: "Giáo viên", mode: "teachers" },
    { label: "Lớp học", mode: "classes" },
  ];

  const cardViewMap: Record<typeof viewMode, string[]> = {
    all: ["Học sinh", "Giáo viên", "Lớp học"],
    students: ["Học sinh"],
    teachers: ["Giáo viên"],
    classes: ["Lớp học"],
  };

  // ===== RENDER =====
  return (
    <ThemeProvider theme={appTheme}>
      <motion.div
        className="admin-dashboard"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
          Thống kê hệ thống
        </Typography>

        {/* Nút lọc chế độ xem */}
        <Box sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {viewModes.map((btn, idx) => (
            <Button
              key={idx}
              variant={viewMode === btn.mode ? "contained" : "outlined"}
              onClick={() => setViewMode(btn.mode)}
            >
              {btn.label}
            </Button>
          ))}
        </Box>

        {/* Cards tổng quan */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1fr 1fr 1fr 1fr",
            },
            gap: 3,
            mb: 3,
          }}
        >
          {[
            {
              title: "Học sinh",
              value: studentsData.length,
              color: appTheme.statsColors.students,
            },
            {
              title: "Giáo viên",
              value: teachersData.length,
              color: appTheme.statsColors.teachers,
            },
            {
              title: "Lớp học",
              value: classesData.length,
              color: appTheme.statsColors.classes,
            },
          ]
            .filter((item) => cardViewMap[viewMode].includes(item.title))
            .map((item, i) => (
              <Card
                key={i}
                sx={{ bgcolor: item.color, borderRadius: 3, boxShadow: 2 }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ color: "#374151" }}>
                    {item.title}
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: "bold", color: "#111827" }}
                  >
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            ))}
        </Box>

        {/* Thống kê theo năm */}
        <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
          <Autocomplete
            freeSolo
            size="small"
            options={["Tất cả", ...combinedYears]}
            value={selectedYear ?? "Tất cả"}
            onChange={(_, val) =>
              setSelectedYear(
                val === "Tất cả" ? null : ((val as string) ?? null),
              )
            }
            renderInput={(params) => (
              <TextField {...params} label="Chọn năm" sx={{ width: 160 }} />
            )}
          />

          {selectedYear && (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Card
                sx={{ bgcolor: appTheme.statsColors.students, borderRadius: 3 }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ color: "#374151" }}>
                    Học sinh ({selectedYear})
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {studentsByYear[selectedYear] ?? 0}
                  </Typography>
                </CardContent>
              </Card>

              <Card
                sx={{ bgcolor: appTheme.statsColors.classes, borderRadius: 3 }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ color: "#374151" }}>
                    Lớp học ({selectedYear})
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {classesByYear[selectedYear] ?? 0}
                  </Typography>
                </CardContent>
              </Card>

              <Card
                sx={{ bgcolor: appTheme.statsColors.teachers, borderRadius: 3 }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ color: "#374151" }}>
                    Giáo viên ({selectedYear})
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {teachersByYear[selectedYear] ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>

        {/* Metric selector + year compare (for tuition / scores) */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
          <Button
            variant={metric === "counts" ? "contained" : "outlined"}
            onClick={() => setMetric("counts")}
          >
            Số lượng
          </Button>
          <Button
            variant={metric === "tuition" ? "contained" : "outlined"}
            onClick={() => setMetric("tuition")}
          >
            Doanh thu
          </Button>
          <Button
            variant={metric === "scores" ? "contained" : "outlined"}
            onClick={() => setMetric("scores")}
          >
            Điểm
          </Button>

          {metric !== "counts" && (
            <Box sx={{ display: "flex", gap: 1, ml: 2, alignItems: "center" }}>
              <Autocomplete
                freeSolo
                size="small"
                options={combinedYears}
                value={String(yearA)}
                onChange={(_, val) =>
                  setYearA(Number(val ?? new Date().getFullYear()))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Năm A" />
                )}
                sx={{ width: 120 }}
              />
              <Autocomplete
                freeSolo
                size="small"
                options={combinedYears}
                value={String(yearB)}
                onChange={(_, val) =>
                  setYearB(Number(val ?? new Date().getFullYear() - 1))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Năm B" />
                )}
                sx={{ width: 120 }}
              />
            </Box>
          )}
        </Box>

        {/* Biểu đồ thống kê */}
        <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <ReactApexChart
              options={apexOptions}
              series={apexSeries}
              type={metric === "counts" ? "bar" : "area"}
              height={350}
            />
          </CardContent>
        </Card>
      </motion.div>
    </ThemeProvider>
  );
};

export default AdminDashboard;
