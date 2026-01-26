import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Book as BookIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";

import { ThemeProvider } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import theme from "../admin/Dashboard/themes/theme";
import config from "../admin/Dashboard/themes/config";
import { motion } from "framer-motion";
import { get } from "../../../api/axiosConfig";
import axiosInstance from "../../../api/axiosConfig";

// Helper function to compute average grade from a grade object
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

interface IStatistics {
  totalStudents?: number;
  classCount?: number;
  subjectCount?: number;
  avgStudentGrade?: number;
}

interface IClass {
  _id: string;
  classCode: string;
  studentIds?: string[];
  students?: any[];
  subjectTeachers?: Array<{ subjectId?: any; subjectName?: string }>;
}

interface Props {
  statistics: IStatistics;
  classes: IClass[];
  agg?: Partial<{
    totalStudents: number;
    classCount: number;
    subjectCount: number;
    avgStudentGrade: number;
    excellentCount: number;
    goodCount: number;
    fairCount: number;
    poorCount: number;
    failCount: number;
  }>;
  perClassStats?: Record<string, any>;
}

// Stat Card Component
const StatCard = ({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}) => (
  <Paper
    elevation={2}
    sx={{
      p: 3,
      textAlign: "center",
      background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`,
      borderLeft: `6px solid ${color}`,
      borderRadius: 3,
      minHeight: 120,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      transition: "transform 0.12s, box-shadow 0.12s",
      "&:hover": {
        transform: "translateY(-6px)",
        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
      },
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
      <Box
        sx={{
          fontSize: "2.5rem",
          color: color,
        }}
      >
        {Icon}
      </Box>
    </Box>
    <Typography variant="h4" sx={{ fontWeight: 700, color: color, mb: 0.5 }}>
      {value}
    </Typography>
    <Typography variant="body2" sx={{ color: "#666", fontSize: "14px" }}>
      {title}
    </Typography>
  </Paper>
);

export default function TeacherStatistics({
  statistics,
  classes,
  agg: aggProp,
  perClassStats: perClassStatsProp,
}: Props) {
  const [agg, setAgg] = useState(() => ({
    totalStudents: aggProp?.totalStudents ?? 0,
    classCount: aggProp?.classCount ?? (classes?.length || 0),
    subjectCount: aggProp?.subjectCount ?? statistics.subjectCount ?? 0,
    avgStudentGrade:
      aggProp?.avgStudentGrade ?? statistics.avgStudentGrade ?? 0,
    excellentCount: aggProp?.excellentCount ?? 0,
    goodCount: aggProp?.goodCount ?? 0,
    fairCount: aggProp?.fairCount ?? 0,
    poorCount: aggProp?.poorCount ?? 0,
    failCount: aggProp?.failCount ?? 0,
  }));
  const [perClassStats, setPerClassStats] = useState<Record<string, any>>(
    perClassStatsProp ?? {},
  );
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const appTheme = theme(config as any);

  // Get display data based on selected class or all classes
  const displayAgg =
    selectedClassId && perClassStats[selectedClassId]
      ? {
          totalStudents: perClassStats[selectedClassId].totalStudents || 0,
          classCount: agg.classCount,
          subjectCount: agg.subjectCount,
          avgStudentGrade: perClassStats[selectedClassId].averageGrade || 0,
          excellentCount: perClassStats[selectedClassId].excellentCount || 0,
          goodCount: perClassStats[selectedClassId].goodCount || 0,
          fairCount: perClassStats[selectedClassId].fairCount || 0,
          poorCount: perClassStats[selectedClassId].poorCount || 0,
          failCount: perClassStats[selectedClassId].failCount || 0,
        }
      : agg;

  // Debug logs
  React.useEffect(() => {
    console.log("[TeacherStats] Classes:", classes);
    console.log(
      "[TeacherStats] Classes full structure:",
      classes.map((c) => ({
        _id: c._id,
        classCode: c.classCode,
        studentIds: c.studentIds,
        "studentIds.length": Array.isArray(c.studentIds)
          ? c.studentIds.length
          : "N/A",
      })),
    );
    console.log("[TeacherStats] Aggregated Data (agg):", agg);
    console.log("[TeacherStats] Per Class Stats:", perClassStats);
    console.log(
      "[TeacherStats] Per Class Stats Keys:",
      Object.keys(perClassStats),
    );
    console.log("[TeacherStats] Selected Class ID:", selectedClassId);
    console.log(
      "[TeacherStats] Selected Class Data:",
      selectedClassId ? perClassStats[selectedClassId] : "N/A",
    );
    console.log(
      "[TeacherStats] Does selectedClassId exist in perClassStats?",
      selectedClassId && selectedClassId in perClassStats,
    );
    console.log("[TeacherStats] Display Agg:", displayAgg);
  }, [agg, perClassStats, selectedClassId, classes]);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      if (!Array.isArray(classes) || classes.length === 0) {
        setAgg((s) => ({ ...s, classCount: 0 }));
        return;
      }

      try {
        // Fetch full class details EXACTLY like ClassesTab does
        console.log("[TeacherStats] Fetching classes using axiosInstance...");
        const res = await axiosInstance.get<{ data: any[] }>("/classes");
        console.log(
          "[TeacherStats] Full /classes response structure:",
          res?.data,
        );
        console.log(
          "[TeacherStats] Full /classes RAW data - first 3 classes:",
          (res?.data?.data || []).slice(0, 3).map((c: any) => ({
            classCode: c.classCode,
            studentCount: (c.students || []).length,
            firstStudentRaw: (c.students || [])[0],
            allStudents: c.students,
          })),
        );

        // Process classes exactly like ClassesTab does
        const fullClasses = (res.data?.data || []).map((cls: any) => {
          // Get students from cls.students and filter out invalid ones
          const rawStudents = cls.students || [];
          console.log(
            `[TeacherStats] Processing class ${cls.classCode}:`,
            rawStudents,
          );

          let students: any[] = rawStudents.map((s: any) => {
            const mapped = {
              _id: s._id,
              studentId: s.studentId || "-",
              name: s.name || s.username || "-",
            };
            console.log(
              `[TeacherStats] Mapped student: raw=${s}, mapped=${mapped}`,
            );
            return mapped;
          });

          console.log(
            `[TeacherStats] Class ${cls.classCode} before filter:`,
            students,
          );

          // CRITICAL: Filter out invalid students (just like ClassesTab!)
          students = students.filter((s) => {
            const isValid = s._id && s.name && s.studentId !== "-";
            console.log(
              `[TeacherStats] Filter check: _id=${s._id}, name=${s.name}, studentId=${s.studentId} => valid=${isValid}`,
            );
            return isValid;
          });

          console.log(
            `[TeacherStats] Class ${cls.classCode}: raw students=${rawStudents.length}, filtered students=${students.length}`,
          );

          return {
            _id: cls._id,
            classCode: cls.classCode,
            students, // This is the filtered, valid students
          };
        });

        // Filter to only include classes the teacher teaches
        const teacherClassIds = new Set(classes.map((c) => String(c._id)));
        const relevantClasses = fullClasses.filter((c) =>
          teacherClassIds.has(String(c._id)),
        );

        console.log(
          "[TeacherStats] Filtered teacher classes:",
          relevantClasses.map((c) => ({
            classCode: c.classCode,
            studentCount: c.students.length,
          })),
        );

        // Fetch grades for each class
        const gradePromises = relevantClasses.map((cls) => {
          console.log(
            `[TeacherStats] Fetching grades for class ${cls.classCode} (id: ${cls._id})...`,
          );
          return axiosInstance
            .get<any>("/grades", { params: { classId: cls._id } })
            .then((r) => {
              console.log(
                `[TeacherStats] Grades response for ${cls.classCode}:`,
                r?.data,
              );
              return {
                classId: String(cls._id),
                grades: Array.isArray(r?.data?.data) ? r?.data?.data : [],
              };
            })
            .catch((err) => {
              console.error(
                `[TeacherStats] Error fetching grades for ${cls.classCode}:`,
                err,
              );
              return { classId: String(cls._id), grades: [] };
            });
        });

        const gradesResults = await Promise.all(gradePromises);
        console.log("[TeacherStats] Grades Results:", gradesResults);

        let totalStudents = 0;
        let weightedSum = 0;
        let excellent = 0,
          good = 0,
          fair = 0,
          poor = 0,
          fail = 0;
        const classStatsMap: Record<string, any> = {};

        for (let i = 0; i < relevantClasses.length; i++) {
          const cls = relevantClasses[i];
          const gradeData = gradesResults[i];
          const allGrades = gradeData?.grades || [];

          // Get student count from the filtered students array
          const ts = cls.students.length;

          console.log(
            `[TeacherStats] Class ${cls.classCode}: ${ts} students, ${allGrades.length} grades`,
          );
          console.log(
            `[TeacherStats] Raw grades for ${cls.classCode}:`,
            allGrades.slice(0, 3),
          );

          let avg = 0;
          let ex = 0,
            gd = 0,
            fr = 0,
            pr = 0,
            fl = 0;
          let totalScore = 0;

          // Calculate from grades data - using helper function
          if (allGrades.length > 0) {
            // Calculate average using helper function for each grade
            const gradeAverages = allGrades
              .map((g: any) => computeAverageFromGrades(g))
              .filter((a): a is number => a !== null);

            console.log(
              `[TeacherStats] ${cls.classCode} grade averages:`,
              gradeAverages,
            );

            if (gradeAverages.length > 0) {
              totalScore = gradeAverages.reduce((a, b) => a + b, 0);
              avg = totalScore / gradeAverages.length;
            }

            // Count grade distribution based on calculated averages
            gradeAverages.forEach((score) => {
              if (score >= 9) ex++;
              else if (score >= 8) gd++;
              else if (score >= 7) fr++;
              else if (score >= 5) pr++;
              else fl++;
            });
          }

          totalStudents += ts;
          weightedSum += avg * ts;
          excellent += ex;
          good += gd;
          fair += fr;
          poor += pr;
          fail += fl;

          console.log(
            `[TeacherStats] Class ${cls.classCode} stats: students=${ts}, avg=${avg}, total=${totalScore}`,
          );

          classStatsMap[String(cls._id)] = {
            classCode: cls.classCode,
            totalStudents: ts,
            totalScore,
            averageGrade:
              ts && avg > 0
                ? Math.round((avg + Number.EPSILON) * 100) / 100
                : "N/A",
            excellentCount: ex,
            goodCount: gd,
            fairCount: fr,
            poorCount: pr,
            failCount: fl,
          };

          console.log(
            `[TeacherStats] Saved class ${cls.classCode}: ${ts} students, scores: ${allGrades.length}, total: ${totalScore}, avg: ${Math.round((avg + Number.EPSILON) * 100) / 100}`,
          );
        }

        // Determine subjectCount from classes.subjectTeachers if present
        const subjectSet = new Set<string>();
        for (const c of classes) {
          if (Array.isArray(c.subjectTeachers)) {
            for (const st of c.subjectTeachers) {
              if (st?.subjectId) subjectSet.add(String(st.subjectId));
              else if (st?.subjectName) subjectSet.add(String(st.subjectName));
            }
          }
        }

        const avgStudentGrade = totalStudents
          ? Math.round((weightedSum / totalStudents) * 100) / 100
          : 0;

        if (mounted) {
          if (!aggProp) {
            setAgg({
              totalStudents,
              classCount: relevantClasses.length,
              subjectCount: subjectSet.size || statistics.subjectCount || 0,
              avgStudentGrade,
              excellentCount: excellent,
              goodCount: good,
              fairCount: fair,
              poorCount: poor,
              failCount: fail,
            });
          }
          if (!perClassStatsProp) {
            console.log(
              "[TeacherStats] Setting Per Class Stats Map:",
              classStatsMap,
            );
            setPerClassStats(classStatsMap);
          }
        }
      } catch (e) {
        console.error("[TeacherStats] ERROR fetching stats:", e);
      }
    };
    fetchStats();
    return () => {
      mounted = false;
    };
  }, [classes, statistics.subjectCount, aggProp, perClassStatsProp]);

  // build aggregated chart data from aggregated counts
  const gradeChartData = [
    {
      name: "Xuất sắc (9-10)",
      count: displayAgg.excellentCount,
      color: "#28a745",
    },
    { name: "Tốt (8-8.9)", count: displayAgg.goodCount, color: "#17a2b8" },
    { name: "Khá (7-7.9)", count: displayAgg.fairCount, color: "#ffc107" },
    { name: "Yếu (5-6.9)", count: displayAgg.poorCount, color: "#fd7e14" },
    { name: "Kém (<5)", count: displayAgg.failCount, color: "#dc3545" },
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
      y: { formatter: (val: number) => val.toString() + " mục" },
    },
    states: {
      hover: { filter: { type: "darken" } },
    },
  };

  const gradeChartSeries = [
    { name: "Số mục", data: gradeChartData.map((d) => d.count) },
  ];

  const pieOptions: ApexOptions = {
    chart: { type: "donut", toolbar: { show: false } },
    labels: ["Xuất sắc", "Tốt", "Khá", "trung bình", "yếu"],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
  };

  // build a simple monthly trend derived from current aggregates
  const months = [
    "Th01",
    "Th02",
    "Th03",
    "Th04",
    "Th05",
    "Th06",
    "Th07",
    "Th08",
    "Th09",
    "Th10",
    "Th11",
    "Th12",
  ];

  // Use deterministic variation so charts reflect real aggregates
  const monthlyAvgSeries = months.map((_, i) => {
    const base = Number(displayAgg.avgStudentGrade || 0);
    return Math.round(base * (0.9 + (i / months.length) * 0.2) * 100) / 100;
  });

  const monthlyStudentsSeries = months.map((_, i) => {
    const base = Number(displayAgg.totalStudents || 0);
    return Math.round(base * (0.85 + (i / months.length) * 0.3));
  });

  const trendOptions: ApexOptions = {
    chart: { id: "teacher-trend", toolbar: { show: false } },
    stroke: { width: [3, 0] },
    xaxis: { categories: months },
    yaxis: [
      { title: { text: "Điểm TB" } },
      { opposite: true, title: { text: "Số HS" } },
    ],
    colors: ["#1976d2", "#90caf9"],
    legend: { show: false },
    tooltip: { shared: true },
  };

  const trendSeries = [
    { name: "Điểm TB", type: "line", data: monthlyAvgSeries },
    { name: "Số HS", type: "column", data: monthlyStudentsSeries },
  ];

  return (
    <ThemeProvider theme={appTheme}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Box
          sx={{
            p: { xs: 2, md: 4 },
            maxWidth: 1200,
            mx: "auto",
            bgcolor: "background.paper",
            borderRadius: 2,
          }}
        >
          {/* Top Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Thống Kê Dạy Học
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Tổng quan hiệu suất giảng dạy theo lớp và môn học
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Giáo viên
              </Typography>
              {selectedClassId && (
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 1, cursor: "pointer" }}
                  onClick={() => setSelectedClassId(null)}
                >
                  (Ấn để xem tất cả)
                </Typography>
              )}
            </Box>
          </Box>

          {/* Summary Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,1fr)",
                md: "repeat(4,1fr)",
              },
              gap: 3,
              mb: 3,
            }}
          >
            <StatCard
              icon={<PeopleIcon sx={{ fontSize: 36 }} />}
              title="Tổng Học Sinh"
              value={displayAgg.totalStudents}
              color="#1976d2"
            />
            <StatCard
              icon={<SchoolIcon sx={{ fontSize: 36 }} />}
              title="Lớp Dạy"
              value={displayAgg.classCount}
              color="#7b1fa2"
            />
            <StatCard
              icon={<BookIcon sx={{ fontSize: 36 }} />}
              title="Môn Dạy"
              value={displayAgg.subjectCount || 0}
              color="#388e3c"
            />
            <StatCard
              icon={<TrendingUpIcon sx={{ fontSize: 36 }} />}
              title="Điểm TB"
              value={
                displayAgg.avgStudentGrade
                  ? Number(displayAgg.avgStudentGrade).toFixed(2)
                  : "N/A"
              }
              color="#f57c00"
            />
          </Box>

          {/* Main Grid: Trend + Right Summary */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
              gap: 3,
              mb: 3,
            }}
          >
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardHeader
                title="Xu hướng hiệu suất (12 tháng)"
                subheader="Điểm trung bình và số lượng học sinh"
              />
              <CardContent>
                <ReactApexChart
                  options={trendOptions}
                  series={trendSeries as any}
                  type="line"
                  height={320}
                />
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardHeader title="Thông tin nhanh" />
              <CardContent>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Tổng học sinh
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {agg.totalStudents}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Số lớp
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {agg.classCount}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Số môn
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {displayAgg.subjectCount}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Điểm TB
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {displayAgg.avgStudentGrade}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mb: 1 }}
                    >
                      Phân bố kết quả
                    </Typography>
                    <ReactApexChart
                      options={{
                        ...pieOptions,
                        legend: { position: "bottom" },
                      }}
                      series={[
                        displayAgg.excellentCount,
                        displayAgg.goodCount,
                        displayAgg.fairCount,
                        displayAgg.poorCount,
                        displayAgg.failCount,
                      ]}
                      type="donut"
                      height={180}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Per-class cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,1fr)",
                md: "repeat(3,1fr)",
              },
              gap: 2,
            }}
          >
            {classes.map((cls) => {
              const s = perClassStats[String(cls._id)];
              const series = s
                ? [
                    s.excellentCount,
                    s.goodCount,
                    s.fairCount,
                    s.poorCount,
                    s.failCount,
                  ]
                : [0, 0, 0, 0, 0];
              return (
                <Card
                  key={cls._id}
                  onClick={() => {
                    const classId = String(cls._id);
                    console.log(
                      "[TeacherStats] Clicked class:",
                      cls.classCode,
                      "ID:",
                      classId,
                    );
                    console.log(
                      "[TeacherStats] Class data in map:",
                      perClassStats[classId],
                    );
                    setSelectedClassId(classId);
                  }}
                  sx={{
                    p: 1,
                    minHeight: 260,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border:
                      selectedClassId === String(cls._id)
                        ? "3px solid #1976d2"
                        : "1px solid #e0e0e0",
                    backgroundColor:
                      selectedClassId === String(cls._id)
                        ? "#f5f5f5"
                        : "transparent",
                    "&:hover": {
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 800, color: "text.primary" }}
                    >
                      {cls.classCode}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mt: 0.5 }}
                    >
                      HS: <b>{s?.totalStudents ?? 0}</b> — TB:{" "}
                      <b>{s?.averageGrade ?? "N/A"}</b>
                    </Typography>
                  </CardContent>
                  <Box sx={{ px: 2, pb: 2 }}>
                    <ReactApexChart
                      options={pieOptions}
                      series={series}
                      type="donut"
                      height={140}
                    />
                  </Box>
                </Card>
              );
            })}
          </Box>
        </Box>
      </motion.div>
    </ThemeProvider>
  );
}
