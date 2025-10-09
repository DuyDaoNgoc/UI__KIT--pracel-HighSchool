import { useState } from "react";
import { fetchGrades, fetchCredits, fetchSchedule, fetchTuition, } from "./profileData";
export default function useProfileData() {
    const [grades, setGrades] = useState([]);
    const [credits, setCredits] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [tuition, setTuition] = useState(null);
    const [error, setError] = useState(null);
    const fetchAll = async (tab, userId) => {
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
        }
        catch (err) {
            console.error("Error fetching data:", err);
            setError(err.message || "Unknown error");
        }
    };
    return { grades, credits, schedule, tuition, error, fetchAll };
}
