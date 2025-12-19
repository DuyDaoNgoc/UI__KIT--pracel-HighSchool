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
  const [formSelectedClass, setFormSelectedClass] = useState<string>("");
  const [formSelectedSubject, setFormSelectedSubject] = useState<string>("");
  const [filterSelectedClass, setFilterSelectedClass] = useState<string>("");
  const [search, setSearch] = useState("");
  const [creatingLock, setCreatingLock] = useState(false);

  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [locksRes, classesRes, subjectsRes] = await Promise.all([
          axiosInstance.get<{ data: GradeLock[] }>("/grades/lock/locks"),
          axiosInstance.get<{ data: Class[]; success?: boolean }>("/classes"),
          axiosInstance.get<{ data: Subject[] }>("/subjects"),
        ]);

        console.log("🔍 Locks Response:", locksRes.data);
        console.log("🔍 Classes Response:", classesRes.data);
        console.log("🔍 Subjects Response:", subjectsRes.data);

        // Handle locks: { data: [...] }
        const locksData = locksRes.data?.data || [];
        setLocks(locksData);
        console.log("✅ Locks set to:", locksData);

        // Handle classes: { data: [...], success: true }
        const classesData = classesRes.data?.data || [];
        setClasses(classesData);
        console.log("✅ Classes set to:", classesData);

        // Handle subjects: { data: [...] }
        const subjectsData = subjectsRes.data?.data || [];
        setSubjects(subjectsData);
        console.log("✅ Subjects set to:", subjectsData);
      } catch (err) {
        console.error("❌ fetchData error:", err);
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const normalizeId = (v: any) => {
    if (!v && v !== 0) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return v._id || v.id || "";
    return String(v);
  };

  const handleToggleLock = async (classId: string, subjectId: string) => {
    const normalizeId = (v: any) => {
      if (!v && v !== 0) return "";
      if (typeof v === "string") return v;
      if (typeof v === "object") return v._id || v.id || "";
      return String(v);
    };

    const cid = normalizeId(classId);
    const sid = normalizeId(subjectId);

    const lock = locks.find((l) => {
      const lc = normalizeId((l as any).classId);
      const ls = normalizeId((l as any).subjectId);
      return lc === cid && ls === sid;
    });
    const isCurrentlyLocked = lock?.isLocked;

    try {
      const endpoint = isCurrentlyLocked
        ? `/grades/lock/unlock/${cid}/${sid}`
        : `/grades/lock/lock/${cid}/${sid}`;

      const res = await axiosInstance.post<{ lock: GradeLock }>(endpoint);

      if (res.data?.lock) {
        setLocks((prev) =>
          prev.map((l) => {
            const lc = normalizeId((l as any).classId);
            const ls = normalizeId((l as any).subjectId);
            return lc === cid && ls === sid ? res.data.lock : l;
          }),
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

  const handleCreateLock = async () => {
    if (!formSelectedClass || !formSelectedSubject) {
      toast.error("Vui lòng chọn lớp và môn học");
      return;
    }

    setCreatingLock(true);
    try {
      const normalizeId = (v: any) => {
        if (!v && v !== 0) return "";
        if (typeof v === "string") return v;
        if (typeof v === "object") return v._id || v.id || "";
        return String(v);
      };
      const cid = normalizeId(formSelectedClass);
      const sid = normalizeId(formSelectedSubject);

      const res = await axiosInstance.post<{ lock: GradeLock }>(
        `/grades/lock/lock/${cid}/${sid}`,
      );

      if (res.data?.lock) {
        // Thêm vào danh sách nếu chưa có
        const existingIndex = locks.findIndex(
          (l) =>
            l.classId === formSelectedClass &&
            l.subjectId === formSelectedSubject,
        );

        if (existingIndex >= 0) {
          setLocks((prev) =>
            prev.map((l, i) => (i === existingIndex ? res.data.lock : l)),
          );
        } else {
          setLocks((prev) => [...prev, res.data.lock]);
        }

        toast.success("Khóa điểm thành công");
        setFormSelectedClass("");
        setFormSelectedSubject("");
      }
    } catch (err: any) {
      console.error("handleCreateLock error:", err);
      toast.error(err.response?.data?.message || "Khóa điểm thất bại");
    } finally {
      setCreatingLock(false);
    }
  };

  const getClassName = (classId: string) => {
    const cid = normalizeId(classId);
    const cls = classes.find((c) => String(c._id) === String(cid));
    return cls?.classCode || "Không xác định";
  };

  const getSubjectName = (subjectId: string) => {
    const sid = normalizeId(subjectId);
    const subject = subjects.find((s) => String(s._id) === String(sid));
    return subject?.name || "Không xác định";
  };

  // Filter subjects by selected class
  const filteredSubjects = formSelectedClass
    ? subjects.filter((s) => !s.classId || s.classId === formSelectedClass)
    : subjects;

  const filteredLocks = locks.filter((lock) => {
    const matchClass =
      !filterSelectedClass || lock.classId === filterSelectedClass;
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

      {/* Form tạo khóa điểm */}
      <div className="profile__form-section">
        <h3 className="form-subtitle"> khóa điểm</h3>
        <div className="form-group">
          <label>Chọn lớp:</label>
          <select
            value={formSelectedClass}
            onChange={(e) => {
              setFormSelectedClass(e.target.value);
              setFormSelectedSubject(""); // Reset subject khi chọn lớp mới
            }}
            className="form-select"
          >
            <option value="">-- Chọn lớp --</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.classCode}
              </option>
            ))}
          </select>
        </div>

        {formSelectedClass && (
          <div className="form-group">
            <label>Chọn môn học:</label>
            <select
              value={formSelectedSubject}
              onChange={(e) => setFormSelectedSubject(e.target.value)}
              className="form-select"
            >
              <option value="">-- Chọn môn --</option>
              {filteredSubjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleCreateLock}
          disabled={!formSelectedClass || !formSelectedSubject || creatingLock}
          className="btn btn-primary"
        >
          {creatingLock ? "Đang xử lý..." : "Khóa Điểm"}
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="filter-section">
        <div className="form-group">
          <label>Lọc theo lớp:</label>
          <select
            value={filterSelectedClass}
            onChange={(e) => setFilterSelectedClass(e.target.value)}
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
              <tr
                key={`${normalizeId((lock as any).classId)}-${normalizeId((lock as any).subjectId)}`}
              >
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
                    className={`action-btn ${lock.isLocked ? "unlock" : "lock"}`}
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
