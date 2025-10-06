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
        case "credits":
          setCredits(await fetchCredits(userId));
          break;
        case "schedule":
          setSchedule(await fetchSchedule(userId));
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
