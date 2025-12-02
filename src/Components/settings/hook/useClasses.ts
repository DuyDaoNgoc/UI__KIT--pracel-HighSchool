import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { IClass } from "../../../types/class";
import toast from "react-hot-toast";

export default function useClasses() {
  const [classesByMajor, setClassesByMajor] = useState<
    Record<string, IClass[]>
  >({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      setError(null);
      try {
        const res =
          await axiosInstance.get<Record<string, IClass[]>>(
            "/api/admin/classes",
          );
        setClassesByMajor(res.data);
      } catch (err) {
        console.error("⚠️ fetchClasses error:", err);
        setError("Không thể tải danh sách lớp.");
        toast.error("Không thể tải danh sách lớp.");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return { classesByMajor, loading, error };
}
