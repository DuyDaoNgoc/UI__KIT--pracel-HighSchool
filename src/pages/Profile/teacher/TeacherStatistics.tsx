import React from "react";
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
}

interface Props {
  statistics: IStatistics;
  classes: IClass[];
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
      background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 2,
      transition: "transform 0.2s, box-shadow 0.2s",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 8px 16px rgba(0,0,0,0.12)",
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

export default function TeacherStatistics({ statistics, classes }: Props) {
  const totalStudents =
    statistics.totalStudents ||
    classes.reduce((sum, cls) => sum + (cls.studentIds?.length || 0), 0);
  const classCount = statistics.classCount || classes.length;

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 4,
          pb: 2,
          borderBottom: "2px solid #e0e0e0",
        }}
      >
        <TrendingUpIcon sx={{ fontSize: 32, color: "#1976d2" }} />
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
          Thống Kê Dạy Học
        </Typography>
      </Box>

      {/* Statistics Cards Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 3,
          mb: 4,
        }}
      >
        <Box>
          <StatCard
            icon={<PeopleIcon sx={{ fontSize: "2.5rem" }} />}
            title="Tổng Học Sinh"
            value={totalStudents}
            color="#1976d2"
          />
        </Box>

        <Box>
          <StatCard
            icon={<SchoolIcon sx={{ fontSize: "2.5rem" }} />}
            title="Lớp Dạy"
            value={classCount}
            color="#7b1fa2"
          />
        </Box>

        <Box>
          <StatCard
            icon={<BookIcon sx={{ fontSize: "2.5rem" }} />}
            title="Môn Dạy"
            value={statistics.subjectCount || 0}
            color="#388e3c"
          />
        </Box>

        <Box>
          <StatCard
            icon={<TrendingUpIcon sx={{ fontSize: "2.5rem" }} />}
            title="Điểm TB"
            value={
              statistics.avgStudentGrade
                ? statistics.avgStudentGrade.toFixed(2)
                : "N/A"
            }
            color="#f57c00"
          />
        </Box>
      </Box>

      {/* Classes Table Card */}
      <Card
        sx={{
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderRadius: 2,
        }}
      >
        <CardHeader
          title="Danh Sách Lớp Dạy"
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            "& .MuiTypography-root": { color: "white" },
          }}
        />
        <CardContent sx={{ pt: 0 }}>
          {classes.length === 0 ? (
            <Typography
              color="textSecondary"
              sx={{ py: 2, textAlign: "center" }}
            >
              Chưa có lớp dạy nào.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                  >
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      Mã Lớp
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: "white", fontWeight: 600 }}
                    >
                      Số Học Sinh
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.map((cls, idx) => (
                    <TableRow
                      key={cls._id}
                      sx={{
                        backgroundColor: idx % 2 === 0 ? "#f9f9f9" : "white",
                        "&:hover": {
                          backgroundColor: "#f0f0f0",
                        },
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Typography sx={{ fontWeight: 500, color: "#1976d2" }}>
                          {cls.classCode}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2 }}>
                        <Typography sx={{ fontWeight: 600 }}>
                          {cls.studentIds?.length || 0}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
