import axiosInstance from "../../../../api/axiosConfig";
import {
  IGrade,
  ICredit,
  IScheduleItem,
  ITuition,
} from "../../../../types/profiles";

// Fetch grades
export const fetchGrades = async (userId: string): Promise<IGrade[]> => {
  try {
    console.log("Fetching grades for userId:", userId);
    const { data } = await axiosInstance.get<{ grades?: IGrade[] }>(
      `/api/grades/${userId}`
    );
    return data.grades ?? [];
  } catch (err: any) {
    console.error("Error fetching grades:", err.response?.data || err.message);
    return [];
  }
};

// Fetch credits
export const fetchCredits = async (userId: string): Promise<ICredit | null> => {
  try {
    console.log("Fetching credits for userId:", userId);
    const { data } = await axiosInstance.get<ICredit>(`/api/credits/${userId}`);
    return data;
  } catch (err: any) {
    console.error("Error fetching credits:", err.response?.data || err.message);
    return null;
  }
};

// Fetch schedule
export const fetchSchedule = async (
  userId: string
): Promise<IScheduleItem[]> => {
  try {
    console.log("Fetching schedule for userId:", userId);
    const { data } = await axiosInstance.get<{ schedule?: IScheduleItem[] }>(
      `/api/schedule/${userId}`
    );
    return data.schedule ?? [];
  } catch (err: any) {
    console.error(
      "Error fetching schedule:",
      err.response?.data || err.message
    );
    return [];
  }
};

// Fetch tuition
export const fetchTuition = async (
  userId: string
): Promise<ITuition | null> => {
  try {
    console.log("Fetching tuition for userId:", userId);
    const { data } = await axiosInstance.get<ITuition>(
      `/api/tuition/${userId}`
    );
    return data;
  } catch (err: any) {
    console.error("Error fetching tuition:", err.response?.data || err.message);
    return null;
  }
};
