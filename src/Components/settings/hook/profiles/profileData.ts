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
    const { data } = await axiosInstance.get<{ data?: any[] }>(`/api/grades`, {
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
    const { data } = await axiosInstance.get<any>(`/api/users`);
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
export const fetchSchedule = async (
  userId: string,
): Promise<IScheduleItem[]> => {
  try {
    console.log("Fetching schedule for userId:", userId);

    // Lấy user từ /api/users và trả về user.schedule nếu có
    const { data } = await axiosInstance.get<any>(`/api/users`);
    const users: any[] = Array.isArray(data) ? data : data?.data || [];
    const user = users.find((u) => u._id === userId || u.studentId === userId);
    if (!user) return [];

    const raw = user.schedule ?? [];

    // If already in grouped format ({ day, subjects: string[] }), return as-is
    if (Array.isArray(raw) && raw.length > 0 && raw[0].subjects) {
      return raw as IScheduleItem[];
    }

    // Otherwise, normalize from flat schedule items: { day, subject, startTime, endTime }
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
    console.error(
      "Error fetching schedule:",
      err.response?.data || err.message,
    );
    return [];
  }
};

// Fetch tuition (chi phí học tập)
export const fetchTuition = async (
  userId: string,
): Promise<ITuition | null> => {
  try {
    console.log("Fetching tuition for userId:", userId);

    const { data } = await axiosInstance.get<any>(`/api/users`);
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
