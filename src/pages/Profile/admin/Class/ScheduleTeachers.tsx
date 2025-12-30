import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../../../api/axiosConfig";
import "../../../../stylesheets/admin/ScheduleTeachers.scss";

export interface Teacher {
  _id: string;
  name: string;
}

export interface ClassType {
  _id: string;
  grade: string;
  schoolYear: string;
  classLetter: string;
  major: string;
  classCode: string;
  teacherId?: string;
  teacherName?: string;
  studentIds: string[];
}

export interface SelectedClass {
  classCode: string;
  type: "homeroom" | "subject";
}

export interface ScheduleTeachersProps {
  teachers: Teacher[];
  classes?: ClassType[];
  onAssign?: () => void;
}

const ScheduleTeachers: React.FC<ScheduleTeachersProps> = ({
  teachers,
  classes: initialClasses = [],
  onAssign,
}) => {
  const [classes, setClasses] = useState<ClassType[]>(initialClasses);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedClasses, setSelectedClasses] = useState<SelectedClass[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get<{ data: ClassType[] }>("/classes");
        const contentType =
          res.headers?.["content-type"] ||
          res.headers?.get?.("content-type") ||
          "";
        if (contentType.includes("text/html")) {
          toast.error("API trả HTML — sai URL backend!");
          setClasses([]);
          return;
        }
        if (!res.data || !Array.isArray(res.data.data)) {
          toast.error("Dữ liệu lớp không hợp lệ!");
          setClasses([]);
          return;
        }
        const mappedClasses = res.data.data.map((cls) => {
          let teacherName = cls.teacherName;
          if (!teacherName && cls.teacherId) {
            const teacher = teachers.find(
              (t) => String(t._id) === String(cls.teacherId),
            );
            teacherName = teacher?.name || "Chưa gán";
          } else if (!cls.teacherId && !teacherName) {
            teacherName = "Chưa gán";
          }
          return { ...cls, teacherName };
        });
        setClasses(mappedClasses);
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Không thể load danh sách lớp",
        );
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [teachers]);

  const handleClassChange = (
    classCode: string,
    type: "homeroom" | "subject",
    checked: boolean,
  ) => {
    setSelectedClasses((prev) => {
      const filtered = prev.filter(
        (c) => !(c.classCode === classCode && c.type === type),
      );
      return checked ? [...filtered, { classCode, type }] : filtered;
    });
  };

  const handleSubmit = async () => {
    if (!selectedTeacher) return toast.error("Chưa chọn giáo viên!");
    if (selectedClasses.length === 0) return toast.error("Chọn ít nhất 1 lớp");
    try {
      const payload = {
        teacherId: selectedTeacher,
        assignments: selectedClasses,
      };
      const res = await axiosInstance.post<{ message: string }>(
        "/classes/assign-teacher-bulk",
        payload,
      );
      toast.success(res.data.message || "Gán giáo viên thành công!");
      setSelectedTeacher("");
      setSelectedClasses([]);
      if (onAssign) onAssign();
      window.dispatchEvent(new Event("teacherAssigned"));
    } catch (err: any) {
      console.error("Assign error:", err);
      toast.error(err?.response?.data?.message || "Lỗi server khi gán lớp");
    }
  };

  return (
    <div className="schedule-teachers">
      <h2>Xếp giáo viên vào lớp</h2>

      <div className="st-select-teacher">
        <label>Chọn giáo viên:</label>
        <select
          className="st-teacher-select"
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
        >
          <option value="">-- Chọn giáo viên --</option>
          {teachers.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="st-classes-list">
        {loading ? (
          <p>Đang tải lớp...</p>
        ) : classes.length > 0 ? (
          classes.map((cls) => {
            const isHomeroom = selectedClasses.some(
              (c) => c.classCode === cls.classCode && c.type === "homeroom",
            );
            const isSubject = selectedClasses.some(
              (c) => c.classCode === cls.classCode && c.type === "subject",
            );
            return (
              <div key={cls._id} className="st-class-row">
                <span className="st-class-info">
                  {cls.grade}
                  {cls.classLetter} - {cls.major} ({cls.schoolYear}) —{" "}
                  {cls.teacherName}
                </span>

                <label className="st-class-label">
                  <input
                    type="checkbox"
                    checked={isHomeroom}
                    onChange={(e) =>
                      handleClassChange(
                        cls.classCode,
                        "homeroom",
                        e.target.checked,
                      )
                    }
                  />{" "}
                  Chủ nhiệm
                </label>

                <label className="st-class-label">
                  <input
                    type="checkbox"
                    checked={isSubject}
                    onChange={(e) =>
                      handleClassChange(
                        cls.classCode,
                        "subject",
                        e.target.checked,
                      )
                    }
                  />{" "}
                  Bộ môn
                </label>
              </div>
            );
          })
        ) : (
          <p>Chưa có lớp.</p>
        )}
      </div>

      <button onClick={handleSubmit} className="st-assign-button">
        Xếp giáo viên
      </button>
    </div>
  );
};

export default ScheduleTeachers;
