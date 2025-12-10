import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../../api/axiosConfig";

interface ScheduleItem {
  day: string;
  subjectId: string;
  startTime: string;
  endTime: string;
}

interface Timetable {
  _id: string;
  classId: string;
  schedule: ScheduleItem[];
  createdAt?: string;
  className?: string;
}

interface Subject {
  _id: string;
  name: string;
  price: number;
  classId: string;
}

interface ClassData {
  _id: string;
  classCode: string;
  teacherName?: string;
}

const DAYS = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật",
];

export default function TimetableTab() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    { day: "Thứ Hai", subjectId: "", startTime: "07:00", endTime: "08:00" },
  ]);

  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [timetablesRes, classesRes, subjectsRes] = await Promise.all([
          axiosInstance.get<{ data: Timetable[] }>("/timetables"),
          axiosInstance.get<{ data: ClassData[] }>("/classes"),
          axiosInstance.get<{ data: Subject[] }>("/subjects"),
        ]);

        setTimetables(timetablesRes.data?.data || []);
        setClasses(classesRes.data?.data || []);
        setSubjects(subjectsRes.data?.data || []);
      } catch (err) {
        console.error("fetchData error:", err);
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddScheduleItem = () => {
    setSchedule((prev) => [
      ...prev,
      { day: "Thứ Hai", subjectId: "", startTime: "07:00", endTime: "08:00" },
    ]);
  };

  const handleRemoveScheduleItem = (index: number) => {
    setSchedule((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (
    index: number,
    field: keyof ScheduleItem,
    value: string,
  ) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    setSchedule(updated);
  };

  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClass || schedule.length === 0) {
      toast.error("Vui lòng chọn lớp và thêm ít nhất một buổi học");
      return;
    }

    const hasEmptySubject = schedule.some((s) => !s.subjectId);
    if (hasEmptySubject) {
      toast.error("Vui lòng chọn môn học cho tất cả các buổi");
      return;
    }

    setCreating(true);
    try {
      const res = await axiosInstance.post<{ timetable: Timetable }>(
        "/timetables",
        { classId: selectedClass, schedule },
      );
      if (res.data?.timetable) {
        setTimetables((prev) => [
          ...prev.filter((t) => t.classId !== selectedClass),
          res.data.timetable,
        ]);
        setSelectedClass("");
        setSchedule([
          {
            day: "Thứ Hai",
            subjectId: "",
            startTime: "07:00",
            endTime: "08:00",
          },
        ]);
        toast.success("Tạo thời khóa biểu thành công");
      }
    } catch (err: any) {
      console.error("handleCreateTimetable error:", err);
      toast.error(err.response?.data?.message || "Tạo thời khóa biểu thất bại");
    } finally {
      setCreating(false);
    }
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s._id === subjectId);
    return subject?.name || "Không xác định";
  };

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c._id === classId);
    return cls?.classCode || "Không xác định";
  };

  const classSubjects = selectedClass
    ? subjects.filter((s) => s.classId === selectedClass)
    : [];

  return (
    <div className="profile__card">
      <h2 className="profile__title">Quản lý thời khóa biểu</h2>

      {/* Form tạo thời khóa biểu */}
      <form onSubmit={handleCreateTimetable} className="form">
        <div className="form-group">
          <label>Lớp:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            required
          >
            <option value="">-- Chọn lớp --</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.classCode} ({cls.teacherName})
              </option>
            ))}
          </select>
        </div>

        {/* Lịch học */}
        <div className="schedule-container">
          <h3>Lịch học:</h3>
          {schedule.map((item, index) => (
            <div key={index} className="schedule-item">
              <select
                value={item.day}
                onChange={(e) =>
                  handleScheduleChange(index, "day", e.target.value)
                }
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>

              <select
                value={item.subjectId}
                onChange={(e) =>
                  handleScheduleChange(index, "subjectId", e.target.value)
                }
                required
              >
                <option value="">-- Chọn môn học --</option>
                {classSubjects.map((subj) => (
                  <option key={subj._id} value={subj._id}>
                    {subj.name}
                  </option>
                ))}
              </select>

              <input
                type="time"
                value={item.startTime}
                onChange={(e) =>
                  handleScheduleChange(index, "startTime", e.target.value)
                }
                required
              />

              <input
                type="time"
                value={item.endTime}
                onChange={(e) =>
                  handleScheduleChange(index, "endTime", e.target.value)
                }
                required
              />

              {schedule.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveScheduleItem(index)}
                  className="button danger"
                >
                  Xóa
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddScheduleItem}
            className="button secondary"
          >
            + Thêm buổi học
          </button>
        </div>

        <button type="submit" disabled={creating} className="button">
          {creating ? "Đang tạo..." : "Tạo thời khóa biểu"}
        </button>
      </form>

      {/* Danh sách thời khóa biểu */}
      <h3 className="profile__subtitle mt-4">Danh sách thời khóa biểu</h3>
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : timetables.length === 0 ? (
        <p className="no-data">Chưa có thời khóa biểu nào.</p>
      ) : (
        <div className="timetables-list">
          {timetables.map((timetable) => (
            <div key={timetable._id} className="timetable-box">
              <h4>{getClassName(timetable.classId)}</h4>
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th>Thứ</th>
                    <th>Môn học</th>
                    <th>Bắt đầu</th>
                    <th>Kết thúc</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.schedule.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.day}</td>
                      <td>{getSubjectName(item.subjectId)}</td>
                      <td>{item.startTime}</td>
                      <td>{item.endTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
