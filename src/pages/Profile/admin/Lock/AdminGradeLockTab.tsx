import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../../api/axiosConfig";
import { Lock, Unlock } from "lucide-react";

interface GradeLock {
  _id: string;
  classId: string;
  subjectId: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  className?: string;
  subjectName?: string;
}

interface Subject {
  _id: string;
  name: string;
  classId: string;
}

interface Class {
  _id: string;
  classCode: string;
}

export default function AdminGradeLockTab() {
  const [locks, setLocks] = useState<GradeLock[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [search, setSearch] = useState("");

  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [locksRes, classesRes, subjectsRes] = await Promise.all([
          axiosInstance.get<{ data: GradeLock[] }>("/api/grades/lock/locks"),
          axiosInstance.get<{ data: Class[] }>("/api/classes"),
          axiosInstance.get<{ data: Subject[] }>("/api/subjects"),
        ]);

        setLocks(locksRes.data?.data || []);
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

  const handleToggleLock = async (classId: string, subjectId: string) => {
    const lock = locks.find(
      (l) => l.classId === classId && l.subjectId === subjectId,
    );
    const isCurrentlyLocked = lock?.isLocked;

    try {
      const endpoint = isCurrentlyLocked
        ? `/api/grades/lock/unlock/${classId}/${subjectId}`
        : `/api/grades/lock/lock/${classId}/${subjectId}`;

      const res = await axiosInstance.post<{ lock: GradeLock }>(endpoint);

      if (res.data?.lock) {
        setLocks((prev) =>
          prev.map((l) =>
            l.classId === classId && l.subjectId === subjectId
              ? res.data.lock
              : l,
          ),
        );

        toast.success(
          isCurrentlyLocked
            ? "Mở khóa điểm thành công"
            : "Khóa điểm thành công",
        );
      }
    } catch (err: any) {
      console.error("handleToggleLock error:", err);
      toast.error("Cập nhật khóa điểm thất bại");
    }
  };

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c._id === classId);
    return cls?.classCode || "Không xác định";
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s._id === subjectId);
    return subject?.name || "Không xác định";
  };

  const classSubjects = selectedClass
    ? subjects.filter((s) => s.classId === selectedClass)
    : subjects;

  const filteredLocks = locks.filter((lock) => {
    const matchClass = !selectedClass || lock.classId === selectedClass;
    const matchSearch =
      getClassName(lock.classId).toLowerCase().includes(search.toLowerCase()) ||
      getSubjectName(lock.subjectId)
        .toLowerCase()
        .includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  return (
    <div className="profile__card">
      <h2 className="profile__title">Khóa điểm theo môn</h2>

      {/* Bộ lọc */}
      <div className="filter-section">
        <div className="form-group">
          <label>Lọc theo lớp:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">-- Tất cả lớp --</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.classCode}
              </option>
            ))}
          </select>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm lớp, môn học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Danh sách khóa điểm */}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : filteredLocks.length === 0 ? (
        <p className="no-data">Chưa có bản ghi nào.</p>
      ) : (
        <table className="profile__table">
          <thead>
            <tr>
              <th>Lớp</th>
              <th>Môn học</th>
              <th>Trạng thái</th>
              <th>Khóa bởi</th>
              <th>Thời gian</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredLocks.map((lock) => (
              <tr key={`${lock.classId}-${lock.subjectId}`}>
                <td>{getClassName(lock.classId)}</td>
                <td>{getSubjectName(lock.subjectId)}</td>
                <td>
                  <span
                    className={`lock-status ${lock.isLocked ? "locked" : "unlocked"}`}
                  >
                    {lock.isLocked ? (
                      <>
                        <Lock size={14} /> Đã khóa
                      </>
                    ) : (
                      <>
                        <Unlock size={14} /> Mở
                      </>
                    )}
                  </span>
                </td>
                <td>{lock.lockedBy || "-"}</td>
                <td>
                  {lock.lockedAt
                    ? new Date(lock.lockedAt).toLocaleDateString("vi-VN")
                    : "-"}
                </td>
                <td>
                  <button
                    onClick={() =>
                      handleToggleLock(lock.classId, lock.subjectId)
                    }
                    className={`action-btn ${
                      lock.isLocked ? "unlock" : "lock"
                    }`}
                  >
                    {lock.isLocked ? "Mở khóa" : "Khóa"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
