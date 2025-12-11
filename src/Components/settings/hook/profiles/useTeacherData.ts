import { useState } from "react";
import { get } from "../../../../api/axiosConfig";

interface IClass {
  _id: string;
  className?: string;
  classCode: string;
  grade: string;
  classLetter: string;
  schoolYear: string;
  studentIds?: string[];
}

interface IScheduleItem {
  day: string;
  subject: string;
  startTime: string;
  endTime: string;
}

interface IGrade {
  subject: string;
  score: number;
}

interface IStatistics {
  totalStudents?: number;
  classCount?: number;
  subjectCount?: number;
  avgStudentGrade?: number;
}

export default function useTeacherData() {
  const [classes, setClasses] = useState<IClass[]>([]);
  const [schedule, setSchedule] = useState<IScheduleItem[]>([]);
  const [grades, setGrades] = useState<IGrade[]>([]);
  const [statistics, setStatistics] = useState<IStatistics>({});
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async (tab: string, teacherId: string) => {
    setError(null);
    try {
      switch (tab) {
        case "classes":
          await fetchClasses(teacherId);
          break;
        case "schedule":
          await fetchSchedule(teacherId);
          break;
        case "grades":
          await fetchClasses(teacherId); // Also fetch classes for grade entry
          await fetchGrades(teacherId);
          break;
        case "statistics":
          await fetchStatistics(teacherId);
          break;
        default:
          break;
      }
    } catch (err: any) {
      console.error("Error fetching teacher data:", err);
      setError(err.message || "Có lỗi xảy ra");
    }
  };

  const fetchClasses = async (teacherId: string) => {
    try {
      const classes = await get<IClass[]>("/classes");
      const teacherClasses = (classes || []).filter(
        (cls: any) => cls.teacherId === teacherId,
      );
      setClasses(teacherClasses);
    } catch (err: any) {
      console.error("Error fetching classes:", err);
      setClasses([]);
    }
  };

  const fetchSchedule = async (teacherId: string) => {
    try {
      const timetables = (await get<any[]>("/timetables")) || [];
      let allSchedule: IScheduleItem[] = [];

      for (const tt of timetables) {
        // Fetch class to check if teacher owns it
        const classData = await get<IClass>(`/classes/${tt.classId}`).catch(
          () => null,
        );

        if (classData && (classData as any).teacherId === teacherId) {
          allSchedule = allSchedule.concat(tt.schedule || []);
        }
      }

      setSchedule(allSchedule);
    } catch (err: any) {
      console.error("Error fetching schedule:", err);
      setSchedule([]);
    }
  };

  const fetchGrades = async (teacherId: string) => {
    try {
      const grades = await get<IGrade[]>("/grades");
      setGrades(grades || []);
    } catch (err: any) {
      console.error("Error fetching grades:", err);
      setGrades([]);
    }
  };

  const fetchStatistics = async (teacherId: string) => {
    try {
      await fetchClasses(teacherId);

      // Calculate statistics from classes
      const classesRes = await get<IClass[]>("/classes");
      const teacherClasses = (classesRes || []).filter(
        (cls: any) => cls.teacherId === teacherId,
      );

      const totalStudents = teacherClasses.reduce(
        (sum, cls) => sum + (cls.studentIds?.length || 0),
        0,
      );

      setStatistics({
        totalStudents,
        classCount: teacherClasses.length,
        subjectCount: 0, // Will be calculated if needed
        avgStudentGrade: 0, // Will be calculated from grades
      });
    } catch (err: any) {
      console.error("Error fetching statistics:", err);
      setStatistics({});
    }
  };

  return { classes, schedule, grades, statistics, error, fetchAll };
}
