import axiosInstance from "../../../../api/axiosConfig";
import {
  IGrade,
  ICredit,
  IScheduleItem,
  ITuition,
} from "../../../../types/profiles";

// Fetch grades (điểm số)
export const fetchGrades = async (userId: string): Promise<IGrade[]> => {
  try {
    console.log("Fetching grades for userId:", userId);
    // Sử dụng query existing endpoint để lấy điểm theo studentId
    const { data } = await axiosInstance.get<{ data?: any[] }>(`/grades`, {
      params: { studentId: userId },
    });

    // Server trả về mảng grades trong `data` hoặc là các Grade documents
    const grades = data?.data ?? [];

    // Normalize về IGrade[] nếu cần (server có thể trả Grade documents)
    return grades.map((g: any) => ({
      subject: g.subject?.name || g.subject || g.subjectId || "Unknown",
      score: typeof g.score === "number" ? g.score : Number(g.score) || 0,
    }));
  } catch (err: any) {
    console.error("Error fetching grades:", err.response?.data || err.message);
    return [];
  }
};

// Fetch credits (điểm tích lũy)
export const fetchCredits = async (userId: string): Promise<ICredit | null> => {
  try {
    console.log("Fetching credits for userId:", userId);

    // Nếu server chưa có endpoint riêng, lấy user từ /api/users và trích fields credits
    const { data } = await axiosInstance.get<any>(`/users`);
    const users: any[] = Array.isArray(data) ? data : data?.data || [];
    const user = users.find((u) => u._id === userId || u.studentId === userId);
    if (!user) return null;

    return {
      total: user.creditsTotal ?? 0,
      earned: user.creditsEarned ?? 0,
    };
  } catch (err: any) {
    console.error("Error fetching credits:", err.response?.data || err.message);
    return null;
  }
};

// Fetch schedule (thời khóa biểu)
export const fetchSchedule = async (userId: string): Promise<any[]> => {
  try {
    console.log("Fetching schedule for userId:", userId);

    // Lấy user từ `/users` (consistent with other calls)
    const { data } = await axiosInstance.get<any>(`/users`);
    const users: any[] = Array.isArray(data) ? data : data?.data || [];
    const user = users.find((u) => u._id === userId || u.studentId === userId);
    console.log("fetchSchedule: fetched users", users.length, "matched user:", !!user);
    if (!user) return [];

    // Prefer an existing user.schedule pushed by admin (sync from timetables)
    const raw = user.schedule ?? [];
    // If schedule is grouped subjects (legacy), return as-is
    if (Array.isArray(raw) && raw.length > 0 && (raw[0].subjects)) return raw;
    // If schedule is detailed (flattened) keep it and attempt to merge incoming timetables later
    const hasExistingDetailedSchedule = Array.isArray(raw) && raw.length > 0 && Boolean((raw[0] as any).subject);

    // If user is a student and no personal schedule exists, try to derive from timetables
    if (user.role === "student") {
      // find student's classCode (could be string or object)
      const classCode =
        typeof user.classCode === "string"
          ? user.classCode
          : user.classCode?.className || user.classCode?.classCode || null;

      // Fetch classes and timetables
      const [classesRes, timetablesRes, teachersRes] = await Promise.all([
        axiosInstance.get<any>("/classes"),
        axiosInstance.get<any>("/timetables"),
        axiosInstance.get<any>("/teachers").catch(() => axiosInstance.get<any>("/users", { params: { role: "teacher" } })),
      ]);

      const classesList = classesRes.data?.data || classesRes.data || [];
      const timetables = timetablesRes.data?.data || timetablesRes.data || [];
      const teachersList = teachersRes.data?.data || teachersRes.data || [];

      const classesByCode: Record<string, any> = {};
      const classesById: Record<string, any> = {};
      for (const c of classesList) {
        if (!c) continue;
        if (c.classCode) classesByCode[String(c.classCode)] = c;
        if (c._id) classesById[String(c._id)] = c;
      }

      const teachersById: Record<string, string> = {};
      for (const t of teachersList || []) {
        if (!t) continue;
        const id = t._id || t.id;
        if (!id) continue;
        teachersById[String(id)] = t.name || t.fullName || t.username || "(Không tên)";
      }

      // find classId for this student (be permissive: support classCode, class, classId, assignedClass)
      let targetClassId: string | null = null;
      // 1) If user.class is an id that matches classesById, prefer it
      if (user.class && classesById[String(user.class)]) {
        targetClassId = classesById[String(user.class)]._id;
      }
      // 2) If user.classId exists and matches
      else if (user.classId && classesById[String(user.classId)]) {
        targetClassId = classesById[String(user.classId)]._id;
      }
      // 3) If user.classCode is provided and maps to a class
      else if (classCode && classesByCode[String(classCode)]) {
        targetClassId = classesByCode[String(classCode)]._id;
      }
      // 4) Check assignedClass array for an _id or classCode
      else if (user.assignedClass && Array.isArray(user.assignedClass) && user.assignedClass.length > 0) {
        const ac = user.assignedClass[0];
        if (ac) {
          if (ac._id && classesById[String(ac._id)]) targetClassId = classesById[String(ac._id)]._id;
          else {
            const code = ac.classCode || ac.className;
            if (code && classesByCode[String(code)]) targetClassId = classesByCode[String(code)]._id;
          }
        }
      }
      // 5) Fallback: if user.classCode looks like an id and matches classesById
      else if (classCode && classesById[String(classCode)]) {
        targetClassId = classesById[String(classCode)]._id;
      }

      // If we couldn't resolve a specific class for this student, do NOT return all timetables
      if (!targetClassId) {
        console.warn("fetchSchedule: could not resolve class for user, returning empty schedule", userId, user);
        return [];
      }

      // collect schedule items from timetables that belong to targetClassId
      const allSchedule: any[] = [];
      // debug: show timetable class ids
      try {
        const ttClassIds = (timetables || []).map((t: any) => t?.classId?._id || t?.classId);
        console.log("fetchSchedule: timetables classIds:", ttClassIds);
      } catch (e) {
        // ignore
      }

      for (const tt of timetables) {
        const cid = tt?.classId?._id || tt?.classId;
        if (!cid) continue;
        if (String(cid) !== String(targetClassId)) continue;

        const normalized = (tt.schedule || []).map((s: any) => {
          const subj =
            s.subject || s.subjectName || (s.subjectId && (s.subjectId.name || s.subjectId.title)) || "Unknown";
          let teacherName = "-";
          if (s.teacherId) {
            const tid = s.teacherId._id || s.teacherId;
            if (tid && teachersById[String(tid)]) teacherName = teachersById[String(tid)];
            else if (typeof tid === "string") teacherName = String(tid);
          } else if (classesById[String(cid)] && classesById[String(cid)].teacherName) {
            teacherName = classesById[String(cid)].teacherName;
          }

          return {
            day: s.day || "Unknown",
            _id: s._id || s.id || undefined,
            timetableId: tt._id || tt.id || undefined,
            classId: cid,
            classCode: classesById[String(cid)]?.classCode || undefined,
            subject: subj,
            teacherName,
            startTime: s.startTime || "",
            endTime: s.endTime || "",
            week: s.week || "",
            date: s.date || s.periodFrom || "",
          } as any;
        });

        allSchedule.push(...normalized);
      }

      // If user already has detailed schedule items, merge timetables into it (preserve old weeks)
      if (hasExistingDetailedSchedule) {
        const existing: any[] = Array.isArray(raw) ? raw.slice() : [];
        const keyOf = (it: any) => `${it.week||""}::${it.day||""}::${it.startTime||""}::${it.classId||it.classCode||""}::${it.subject||""}`;
        const existingKeys = new Set(existing.map(keyOf));
        for (const it of allSchedule) {
          const k = keyOf(it);
          if (!existingKeys.has(k)) {
            existing.push(it);
            existingKeys.add(k);
          }
        }
        return existing;
      }

      return allSchedule;
    }

    // Fallback: convert user.schedule flat items into grouped subjects array
    const grouped: Record<string, string[]> = {};
    for (const item of raw) {
      const day = item.day || "Unknown";
      const subjName = item.subject || item.subjectName || "Unknown";
      const timeStr =
        item.startTime && item.endTime
          ? ` (${item.startTime}-${item.endTime})`
          : "";
      const label = `${subjName}${timeStr}`;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(label);
    }

    return Object.keys(grouped).map((day) => ({ day, subjects: grouped[day] }));
  } catch (err: any) {
    console.error("Error fetching schedule:", err.response?.data || err.message);
    return [];
  }
};

// Fetch tuition (chi phí học tập)
export const fetchTuition = async (
  userId: string,
): Promise<ITuition | null> => {
  try {
    console.log("Fetching tuition for userId:", userId);

    const { data } = await axiosInstance.get<any>(`/users`);
    const users: any[] = Array.isArray(data) ? data : data?.data || [];
    const user = users.find((u) => u._id === userId || u.studentId === userId);
    if (!user) return null;

    return {
      total: user.tuitionTotal ?? 0,
      paid: user.tuitionPaid ?? 0,
      remaining: user.tuitionRemaining ?? 0,
      daycare: user.daycare ?? null,
      boarding: user.boarding ?? null,
    };
  } catch (err: any) {
    console.error("Error fetching tuition:", err.response?.data || err.message);
    return null;
  }
};
