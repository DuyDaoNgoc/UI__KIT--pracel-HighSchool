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
  students?: Array<{
    _id: string;
    studentId: string;
    name: string;
  }>;
  subjectTeachers?: Array<{
    _id?: string;
    subjectId: any;
    subjectName?: string;
    teacherId: any;
    teacherName?: string;
  }>;
  teacherId?: any;
  teacherName?: string;
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

  const fetchAll = async (
    tab: string,
    teacherId: string,
    assignedClass: Array<any> | null = null,
  ) => {
    setError(null);
    try {
      switch (tab) {
        case "classes":
          await fetchClasses(teacherId, assignedClass);
          break;
        case "schedule":
          await fetchSchedule(teacherId, assignedClass);
          break;
        case "grades":
          await fetchClasses(teacherId, assignedClass); // Also fetch classes for grade entry
          await fetchGrades(teacherId);
          break;
        case "statistics":
          await fetchStatistics(teacherId, assignedClass);
          break;
        default:
          break;
      }
    } catch (err: any) {
      console.error("Error fetching teacher data:", err);
      setError(err.message || "Có lỗi xảy ra");
    }
  };

  const fetchClasses = async (
    teacherId: string,
    assignedClass: Array<any> | null = null,
  ) => {
    try {
      // Try server-side filtered endpoint first
      try {
        const resp = (await get<any>("/classes/my-classes")) || {};
        const serverClasses = resp?.data || resp || [];
        if (Array.isArray(serverClasses) && serverClasses.length > 0) {
          setClasses(serverClasses);
          return;
        }
      } catch (e) {
        // ignore and fallback
        console.warn(
          "/classes/my-classes not available or empty, falling back",
          e,
        );
      }

      // Fallback: fetch all classes and match by assignedClass.classCode if provided
      const response = await get<{ data: IClass[] }>("/classes");
      const allClasses = response?.data || response || [];

      if (
        assignedClass &&
        Array.isArray(assignedClass) &&
        assignedClass.length > 0
      ) {
        const matched = allClasses.filter((c: any) =>
          assignedClass.some(
            (a: any) => a && a.classCode && c.classCode === a.classCode,
          ),
        );
        setClasses(matched);
        return;
      }

      // Final fallback: match by teacherId in class document (handle ObjectId/string)
      const teacherClasses = (allClasses || []).filter((cls: any) => {
        try {
          if (!cls) return false;
          if (String(cls.teacherId) === String(teacherId)) return true;
          // if subjectTeachers array exists, check their teacherId
          if (Array.isArray(cls.subjectTeachers)) {
            return cls.subjectTeachers.some(
              (st: any) => String(st.teacherId) === String(teacherId),
            );
          }
          return false;
        } catch (err) {
          return false;
        }
      });
      setClasses(teacherClasses);
    } catch (err: any) {
      console.error("Error fetching classes:", err);
      setClasses([]);
    }
  };

  const fetchSchedule = async (
    teacherId: string,
    assignedClass: Array<any> | null = null,
  ) => {
    try {
      // `/timetables` returns { data: Timetable[] } - normalize response
      const timetablesRes = (await get<any>("/timetables")) || {};
      const timetables = timetablesRes.data || timetablesRes || [];

      let allSchedule: IScheduleItem[] = [];

      // Also fetch classes once (server exposes GET /api/classes)
      const classesResp = (await get<any>("/classes")) || {};
      const classesList = classesResp.data || classesResp || [];
      const classesById: Record<string, any> = {};
      const classesByCode: Record<string, any> = {};
      for (const c of classesList) {
        if (c && c._id) classesById[String(c._id)] = c;
        if (c && c.classCode) classesByCode[String(c.classCode)] = c;
      }

      // Build set of classIds that belong to this teacher either via Class.teacherId
      // OR via teacher's `assignedClass` entries (classCode).
      const relevantClassIds = new Set<string>();

      // From classes list: find classes where class.teacherId === teacherId
      for (const c of classesList) {
        if (c && String(c.teacherId) === String(teacherId)) {
          if (c._id) relevantClassIds.add(String(c._id));
        }
      }

      // Also consider assignedClass provided from user document (matching by classCode)
      if (Array.isArray(assignedClass) && assignedClass.length > 0) {
        for (const ac of assignedClass) {
          if (!ac) continue;
          const code =
            ac.classCode || (ac.classCode ? String(ac.classCode) : null);
          if (!code) continue;
          const cls = classesByCode[String(code)];
          if (cls && cls._id) relevantClassIds.add(String(cls._id));
        }
      }

      // Now filter timetables for those classIds
      // Fetch teachers to resolve teacher names when schedule items store only ids
      let teachersList: any[] = [];
      try {
        const tRes = (await get<any>("/teachers")) || {};
        teachersList = tRes.data || tRes || [];
      } catch (e) {
        try {
          const tRes2 =
            (await get<any>("/users", { params: { role: "teacher" } })) || {};
          teachersList = tRes2.data || tRes2 || [];
        } catch (e2) {
          teachersList = [];
        }
      }
      const teachersById: Record<string, string> = {};
      for (const t of teachersList) {
        if (!t) continue;
        const id = t._id || t.id || t.userId || null;
        if (!id) continue;
        teachersById[String(id)] =
          t.name || t.fullName || t.username || t.displayName || "(Không tên)";
      }

      for (const tt of timetables) {
        const classId = tt?.classId?._id || tt?.classId;
        if (!classId) continue;
        if (!relevantClassIds.has(String(classId))) continue;

        const normalized = (tt.schedule || []).map((s: any) => {
          const subject =
            s.subject ||
            s.subjectName ||
            (s.subjectId && (s.subjectId.name || s.subjectId.title)) ||
            "Unknown";

          // resolve teacher name: prefer populated object, then teachersById map, then class teacherName
          let teacherName = "-";
          if (s.teacherId) {
            const tid = s.teacherId._id || s.teacherId;
            if (tid && teachersById[String(tid)])
              teacherName = teachersById[String(tid)];
            else if (typeof tid === "string")
              teacherName = teachersById[String(tid)] || String(tid);
          } else {
            const cls = classesById[String(tt.classId?._id || tt.classId)];
            if (cls && cls.teacherName) teacherName = cls.teacherName;
          }

          // If subject is unknown (empty/placeholder), do not show teacher
          if (subject === "Unknown") teacherName = "-";

          return {
            day: s.day || "Unknown",
            // include identifiers so TeacherSchedule can reference the source timetable/item
            _id: s._id || s.id || undefined,
            timetableId: tt._id || tt.id || undefined,
            classId: tt.classId?._id || tt.classId || undefined,
            subject,
            teacherName,
            startTime: s.startTime || "",
            endTime: s.endTime || "",
            week: s.week || "",
            date: s.date || s.periodFrom || "",
          } as any;
        });

        allSchedule = allSchedule.concat(normalized);
      }

      // Merge with existing schedule (preserve old weeks)
      setSchedule((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return allSchedule;
        const keyOf = (it: any) =>
          `${it.week || ""}::${it.day || ""}::${it.startTime || ""}::${it.subject || ""}`;
        const existingKeys = new Set(prev.map(keyOf));
        const merged = prev.slice();
        for (const item of allSchedule) {
          const k = keyOf(item);
          if (!existingKeys.has(k)) {
            merged.push(item);
            existingKeys.add(k);
          }
        }
        return merged;
      });
    } catch (err: any) {
      console.error("Error fetching schedule:", err);
      setSchedule([]);
    }
  };

  const fetchGrades = async (teacherId: string) => {
    try {
      const response = await get<{ data: IGrade[] }>("/grades");
      const grades = response?.data || response || [];
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
      const response = await get<{ data: IClass[] }>("/classes");
      const classesRes = response?.data || response || [];
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
