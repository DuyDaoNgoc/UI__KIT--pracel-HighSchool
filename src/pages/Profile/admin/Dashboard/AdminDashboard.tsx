import React, { useEffect, useState } from "react";
import {
  ThemeProvider,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
} from "@mui/material";
import theme from "./themes/theme";
import config from "./themes/config";
import { motion } from "framer-motion";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

import http, { get } from "../../../../api/axiosConfig";
import { IParent } from "../../../../types/parent";
import { IClass } from "../../../../types/class";

// ===== INTERFACES =====
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
  totalParents: number;
  totalClasses: number;
}
interface ChartDataItem {
  name: string;
  số_lượng: number;
}

// ===== MAIN COMPONENT =====
const AdminDashboard: React.FC = () => {
  // ===== STATE =====
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalClasses: 0,
  });

  const [studentsData, setStudentsData] = useState<IStudent[]>([]);
  const [teachersData, setTeachersData] = useState<ITeacher[]>([]);
  const [parentsData, setParentsData] = useState<IParent[]>([]);
  const [classesData, setClassesData] = useState<IClass[]>([]);

  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [viewMode, setViewMode] = useState<
    "all" | "students" | "teachers" | "parents" | "classes"
  >("all");

  // ===== FETCH DATA =====
  const fetchData = async () => {
    try {
      const [students, teachers, parents, classes] = await Promise.all([
        get<IStudent[]>("/admin/students"),
        get<ITeacher[]>("/admin/teachers"),
        get<IParent[]>("/admin/parents"),
        get<IClass[]>("/admin/classes"),
      ]);

      setStudentsData(students);
      setTeachersData(teachers);
      setParentsData(parents);
      setClassesData(classes);

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalParents: parents.length,
        totalClasses: classes.length,
      });

      // Chart mặc định
      setChartData([
        { name: "Học sinh", số_lượng: students.length },
        { name: "Giáo viên", số_lượng: teachers.length },
        { name: "Phụ huynh", số_lượng: parents.length },
        { name: "Lớp học", số_lượng: classes.length },
      ]);
    } catch (err) {
      console.error("❌ Lỗi tải dữ liệu thống kê:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== UPDATE CHART THEO VIEWMODE =====
  useEffect(() => {
    const baseData: ChartDataItem[] = [
      { name: "Học sinh", số_lượng: studentsData.length },
      { name: "Giáo viên", số_lượng: teachersData.length },
      { name: "Phụ huynh", số_lượng: parentsData.length },
      { name: "Lớp học", số_lượng: classesData.length },
    ];

    const viewMap: Record<typeof viewMode, string> = {
      all: "",
      students: "Học sinh",
      teachers: "Giáo viên",
      parents: "Phụ huynh",
      classes: "Lớp học",
    };

    const filteredData =
      viewMode === "all"
        ? baseData
        : baseData.filter((d) => d.name === viewMap[viewMode]);

    setChartData(filteredData);
  }, [viewMode, studentsData, teachersData, parentsData, classesData]);

  // ===== ApexCharts CONFIG =====
  const apexOptions: ApexOptions = {
    chart: { type: "bar", height: 350, toolbar: { show: true } },
    plotOptions: {
      bar: { borderRadius: 8, horizontal: false, columnWidth: "50%" },
    },
    dataLabels: { enabled: false },
    xaxis: { categories: chartData.map((d) => d.name) },
    tooltip: { y: { formatter: (val: number) => val.toString() } },
  };
  const apexSeries = [
    { name: "Số lượng", data: chartData.map((d) => d.số_lượng) },
  ];

  const viewModes = [
    { label: "Tất cả", mode: "all" },
    { label: "Học sinh", mode: "students" },
    { label: "Giáo viên", mode: "teachers" },
    { label: "Phụ huynh", mode: "parents" },
    { label: "Lớp học", mode: "classes" },
  ];

  const cardViewMap: Record<typeof viewMode, string[]> = {
    all: ["Học sinh", "Giáo viên", "Phụ huynh", "Lớp học"],
    students: ["Học sinh"],
    teachers: ["Giáo viên"],
    parents: ["Phụ huynh"],
    classes: ["Lớp học"],
  };

  // ===== RENDER =====
  return (
    <ThemeProvider theme={theme(config as any)}>
      <motion.div
        className="admin-dashboard"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
          Thống kê hệ thống
        </Typography>

        {/* Nút xem tổng / từng phần */}
        <Box sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {viewModes.map((btn, idx) => (
            <Button
              key={idx}
              variant={viewMode === btn.mode ? "contained" : "outlined"}
              onClick={() =>
                setViewMode(
                  btn.mode as
                    | "all"
                    | "students"
                    | "teachers"
                    | "parents"
                    | "classes"
                )
              }
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
            { title: "Học sinh", value: studentsData.length, color: "#e0f2fe" },
            {
              title: "Giáo viên",
              value: teachersData.length,
              color: "#dcfce7",
            },
            { title: "Phụ huynh", value: parentsData.length, color: "#fef9c3" },
            { title: "Lớp học", value: classesData.length, color: "#ede9fe" },
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

        {/* Biểu đồ ApexCharts */}
        <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
          <CardContent>
            <ReactApexChart
              options={apexOptions}
              series={apexSeries}
              type="bar"
              height={350}
            />
          </CardContent>
        </Card>
      </motion.div>
    </ThemeProvider>
  );
};

export default AdminDashboard;
