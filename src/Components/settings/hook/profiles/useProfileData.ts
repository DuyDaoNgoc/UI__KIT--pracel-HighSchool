import { useState } from "react";
import {
  IGrade,
  ICredit,
  IScheduleItem,
  ITuition,
} from "../../../../types/profiles";
import {
  fetchGrades,
  fetchCredits,
  fetchSchedule,
  fetchTuition,
} from "./profileData";

export default function useProfileData() {
  const [grades, setGrades] = useState<IGrade[]>([]);
  const [credits, setCredits] = useState<ICredit | null>(null);
  const [schedule, setSchedule] = useState<IScheduleItem[]>([]);
  const [tuition, setTuition] = useState<ITuition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async (tab: string, userId: string) => {
    setError(null);
    try {
      switch (tab) {
        case "grades":
          setGrades(await fetchGrades(userId));
          break;
        case "statistics":
          // Statistics also needs grades and tuition
          setGrades(await fetchGrades(userId));
          setTuition(await fetchTuition(userId));
          break;
        case "credits":
          setCredits(await fetchCredits(userId));
          break;
        case "schedule":
          // Merge new schedule with existing (preserve old weeks)
          const newSchedule = await fetchSchedule(userId);
          setSchedule((prev) => {
            if (!Array.isArray(prev) || prev.length === 0) return newSchedule;
            const keyOf = (it: any) =>
              `${it.week || ""}::${it.day || ""}::${it.startTime || ""}::${it.classId || it.classCode || ""}::${it.subject || ""}`;
            const existingKeys = new Set(prev.map(keyOf));
            const merged = prev.slice();
            for (const item of newSchedule) {
              const k = keyOf(item);
              if (!existingKeys.has(k)) {
                merged.push(item);
                existingKeys.add(k);
              }
            }
            return merged;
          });
          break;
        case "tuition":
          setTuition(await fetchTuition(userId));
          break;
        default:
          break;
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Unknown error");
    }
  };

  return { grades, credits, schedule, tuition, error, fetchAll };
}
