import { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { ITeacher } from "../../../types/teacherTypes";
import toast from "react-hot-toast";

export default function useTeachers() {
  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get<ITeacher[]>("/api/admin/teachers");
        setTeachers(res.data);
      } catch (err) {
        console.error("⚠️ fetchTeachers error:", err);
        setError("Không thể tải danh sách giáo viên.");
        toast.error("Không thể tải danh sách giáo viên.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const addTeacher = (newTeacher: ITeacher) => {
    setTeachers((prev: ITeacher[]) => [newTeacher, ...prev]);
  };

  return { teachers, loading, error, addTeacher };
}
