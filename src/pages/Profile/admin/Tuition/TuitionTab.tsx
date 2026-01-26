import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../../api/axiosConfig";
import { useSocket } from "../../../../Components/settings/hook/IOserver/useSocket";
import "../../../../stylesheets/components/profile/_grades.scss";

interface Class {
  _id: string;
  classCode: string;
  major: string;
  grade: string;
  classLetter: string;
  className?: string;
  schoolYear: string;
}

interface Subject {
  _id: string;
  name: string;
  price: number;
}

interface StudentData {
  _id: string;
  name: string;
  studentId: string;
  email?: string;
  phone?: string;
}

interface Tuition {
  _id: string;
  classId: Class;
  schoolYear?: string; // e.g., "2024-2025"
  semester: number;
  subjects: Array<{ subjectId: Subject; price: number }>;
  totalAmount: number;
  description?: string;
  isActive: boolean;
}

interface StudentTuition {
  _id: string;
  tuitionId: string;
  studentId: StudentData;
  schoolYear?: string;
  semester?: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "unpaid" | "partial" | "paid";
  notes?: string;
}

export default function TuitionTab() {
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Student payment management
  const [expandedTuitionId, setExpandedTuitionId] = useState<string | null>(
    null,
  );
  const [studentTuitions, setStudentTuitions] = useState<StudentTuition[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<number>(0);
  const [editingStatus, setEditingStatus] = useState<
    "unpaid" | "partial" | "paid"
  >("unpaid");

  // Form state
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(
    `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  );
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");

  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("🔍 [TuitionTab] Fetching tuitions, classes, subjects...");
        const [tuitionsRes, classesRes, subjectsRes] = await Promise.all([
          axiosInstance.get<Tuition[]>("/tuitions").catch((err) => {
            console.error("❌ Fetch tuitions error:", err);
            return { data: [] };
          }),
          axiosInstance.get<Class[]>("/classes").catch((err) => {
            console.error("❌ Fetch classes error:", err);
            return { data: [] };
          }),
          axiosInstance.get<Subject[]>("/admin/subjects").catch((err) => {
            console.error("❌ Fetch subjects error:", err);
            return { data: [] };
          }),
        ]);

        console.log("📦 [TuitionTab] Tuitions response:", tuitionsRes.data);
        console.log("📦 [TuitionTab] Classes response:", classesRes.data);
        console.log("📦 [TuitionTab] Subjects response:", subjectsRes.data);

        // Handle array data or wrapped data
        const tuitionsData = Array.isArray(tuitionsRes.data)
          ? tuitionsRes.data
          : tuitionsRes.data?.data || [];
        const classesData = Array.isArray(classesRes.data)
          ? classesRes.data
          : classesRes.data?.data || [];
        const subjectsData = Array.isArray(subjectsRes.data)
          ? subjectsRes.data
          : subjectsRes.data?.data || [];

        setTuitions(tuitionsData);
        setClasses(classesData);
        setSubjects(subjectsData);

        console.log("✅ [TuitionTab] Data loaded successfully", {
          tuitions: tuitionsData.length,
          classes: classesData.length,
          subjects: subjectsData.length,
        });
      } catch (err: any) {
        console.error("❌ [TuitionTab] fetchData error:", err);
        console.error("❌ [TuitionTab] Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url,
        });
        toast.error(
          "Lỗi tải dữ liệu: " + (err.response?.data?.message || err.message),
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Socket listeners for real-time tuition updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;

    const onStudentTuitionDeleted = (payload: any) => {
      console.log(
        "🗑️ [TuitionTab] Received student-tuition:deleted event:",
        payload,
      );
      // If a tuition was deleted, check if we need to update our list
      if (payload?.tuitionId) {
        // Remove from student tuitions list
        setStudentTuitions((prev) =>
          prev.filter((st) => st.tuitionId !== payload.tuitionId),
        );
        toast.info(
          `Deleted ${payload.deletedCount || 0} student tuition records`,
        );
      }
    };

    socket.on("student-tuition:deleted", onStudentTuitionDeleted);
    socket.on("student-tuition:updated", () => {
      console.log("🔄 [TuitionTab] Received student-tuition:updated event");
    });
    socket.on("student-tuition:created", () => {
      console.log("🔄 [TuitionTab] Received student-tuition:created event");
    });

    return () => {
      socket.off("student-tuition:deleted", onStudentTuitionDeleted);
      socket.off("student-tuition:updated");
      socket.off("student-tuition:created");
    };
  }, [socket]);

  // Fetch student tuitions for a specific tuition plan
  const fetchStudentTuitions = async (tuitionId: string) => {
    setLoadingStudents(true);
    try {
      console.log(
        "🔍 [TuitionTab] Fetching student tuitions for tuitionId:",
        tuitionId,
      );
      const res = await axiosInstance.get<{ data: StudentTuition[] }>(
        `/tuitions/${tuitionId}/students`,
      );
      console.log("📦 [TuitionTab] Response:", res.data);
      console.log(
        `📊 [TuitionTab] Loaded ${res.data?.data?.length || 0} student tuitions`,
      );
      if (res.data?.data && res.data.data.length > 0) {
        console.log("📋 [TuitionTab] First record:", res.data.data[0]);
      }
      setStudentTuitions(res.data?.data || []);
    } catch (err) {
      console.error("❌ Fetch student tuitions error:", err);
      toast.error("Lỗi tải danh sách học sinh");
    } finally {
      setLoadingStudents(false);
    }
  };

  // Toggle expand/collapse student list
  const handleToggleExpand = async (tuitionId: string) => {
    if (expandedTuitionId === tuitionId) {
      setExpandedTuitionId(null);
    } else {
      setExpandedTuitionId(tuitionId);
      await fetchStudentTuitions(tuitionId);
    }
  };

  // Handle update payment for a student
  const handleUpdatePayment = async (studentTuitionId: string) => {
    if (editingAmount < 0) {
      toast.error("Số tiền không thể âm");
      return;
    }

    try {
      const res = await axiosInstance.put<{ data: StudentTuition }>(
        `/student-tuition/${studentTuitionId}`,
        {
          paidAmount: editingAmount,
          status: editingStatus,
        },
      );

      if (res.data?.data) {
        // Update local state
        setStudentTuitions((prev) =>
          prev.map((st) => (st._id === studentTuitionId ? res.data.data : st)),
        );
        setEditingPaymentId(null);
        toast.success("✅ Cập nhật thanh toán thành công");
      }
    } catch (err: any) {
      console.error("❌ Update payment error:", err);
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );
  };

  const handleCreateTuition = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClass || selectedSubjectIds.length === 0) {
      toast.error("Vui lòng chọn lớp và ít nhất 1 môn học");
      return;
    }

    setCreating(true);
    try {
      const res = await axiosInstance.post<{ data: Tuition }>("/tuitions", {
        classId: selectedClass,
        schoolYear: selectedSchoolYear,
        semester: parseInt(selectedSemester),
        subjectIds: selectedSubjectIds,
        description,
      });

      if (res.data?.data) {
        const newTuition = res.data.data;
        setTuitions((prev) => [newTuition, ...prev]);
        setSelectedClass("");
        setSelectedSchoolYear(
          `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        );
        setSelectedSemester("1");
        setSelectedSubjectIds([]);
        setDescription("");

        // Auto-generate StudentTuition for all students in the class
        try {
          const generateRes = await axiosInstance.post<{
            success: boolean;
            generatedCount: number;
            message: string;
          }>(`/tuitions/${newTuition._id}/generate-for-students`);

          if (generateRes.data?.success) {
            toast.success(
              `✅ Tạo bảng học phí thành công! (${generateRes.data.generatedCount} học sinh)`,
            );
            // Reload to show student tuitions
            await fetchStudentTuitions(newTuition._id);
          }
        } catch (genErr: any) {
          console.warn(
            "⚠️ Auto-generate failed, manual generation may be needed:",
            genErr,
          );
          toast.warning(
            "Tạo bảng học phí thành công, nhưng cần nhấn 'Tạo cho học sinh' thêm",
          );
        }
      }
    } catch (err: any) {
      console.error("❌ Create tuition error:", err);
      toast.error(err.response?.data?.message || "Tạo bảng học phí thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTuition = async (tuitionId: string) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa bảng học phí này?")) return;

    try {
      await axiosInstance.delete(`/tuitions/${tuitionId}`);
      setTuitions((prev) => prev.filter((t) => t._id !== tuitionId));
      toast.success("✅ Xóa bảng học phí thành công");
    } catch (err: any) {
      console.error("❌ Delete tuition error:", err);
      toast.error("Xóa bảng học phí thất bại");
    }
  };

  const handleGenerateForStudents = async (tuitionId: string) => {
    if (
      !window.confirm(
        "Bạn muốn tạo bảng học phí cho tất cả học sinh của lớp này?",
      )
    )
      return;

    try {
      const res = await axiosInstance.post<{
        success: boolean;
        generatedCount: number;
        message: string;
      }>(`/tuitions/${tuitionId}/generate-for-students`);
      if (res.data?.success) {
        toast.success(
          `✅ Tạo thành công cho ${res.data.generatedCount} học sinh`,
        );
        // Reload student list
        await fetchStudentTuitions(tuitionId);
      }
    } catch (err: any) {
      console.error("❌ Generate tuition error:", err);
      toast.error("Tạo bảng học phí cho học sinh thất bại");
    }
  };

  const handleRegenerateForStudents = async (tuitionId: string) => {
    if (
      !window.confirm(
        "⚠️ Cái này sẽ XÓA tất cả bảng học phí cũ và TẠO LẠI mới. Tiếp tục?",
      )
    )
      return;

    try {
      const res = await axiosInstance.post<{
        success: boolean;
        generatedCount: number;
        deletedCount: number;
        message: string;
      }>(`/tuitions/${tuitionId}/regenerate-for-students`);
      if (res.data?.success) {
        toast.success(
          `✅ Tạo lại thành công! Xóa: ${res.data.deletedCount}, Tạo: ${res.data.generatedCount} học sinh`,
        );
        // Reload student list
        await fetchStudentTuitions(tuitionId);
      }
    } catch (err: any) {
      console.error("❌ Regenerate tuition error:", err);
      toast.error("Tạo lại bảng học phí thất bại");
    }
  };

  const handleSyncStudentsToClass = async (classId: string) => {
    if (
      !window.confirm(
        "🔄 Cái này sẽ đồng bộ tất cả học sinh của lớp này. Tiếp tục?",
      )
    )
      return;

    try {
      const res = await axiosInstance.post<{
        success: boolean;
        syncedCount: number;
        message: string;
      }>(`/tuitions/${classId}/sync-students`);
      if (res.data?.success) {
        toast.success(`✅ Đã đồng bộ ${res.data.syncedCount} học sinh vào lớp`);
      }
    } catch (err: any) {
      console.error("❌ Sync students error:", err);
      toast.error("Đồng bộ học sinh thất bại");
    }
  };

  const getTotalAmount = () => {
    return selectedSubjectIds.reduce((sum, subjectId) => {
      const subject = subjects.find((s) => s._id === subjectId);
      return sum + (subject?.price || 0);
    }, 0);
  };

  const filteredTuitions = tuitions.filter((t) =>
    t.classId?.classCode.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Toaster position="top-right" />
      <div className="profile__card">
        <h2 className="profile__title">Quản Lý Bảng Học Phí</h2>

        {/* Form tạo bảng học phí */}
        <div className="profile__form-section">
          <h3 className="form-subtitle">Tạo Bảng Học Phí Mới</h3>
          <form onSubmit={handleCreateTuition}>
            <div className="form-group">
              <label>Chọn Lớp Học:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="form-select"
              >
                <option value="">-- Chọn lớp --</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.classCode} - {cls.major} (
                    {cls.className || `Lớp ${cls.grade}${cls.classLetter}`})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Chọn Năm Học:</label>
              <select
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                className="form-select"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>

            <div className="form-group">
              <label>Chọn Kì Học:</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="form-select"
              >
                <option value="1">Kì 1</option>
                <option value="2">Kì 2</option>
              </select>
            </div>

            <div className="form-group">
              <label>Chọn Môn Học:</label>
              <div
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  padding: "10px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {subjects.map((subject) => (
                  <label
                    key={subject._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjectIds.includes(subject._id)}
                      onChange={() => handleToggleSubject(subject._id)}
                      style={{ marginRight: "8px" }}
                    />
                    <span>{subject.name}</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "#888",
                        fontSize: "12px",
                      }}
                    >
                      {subject.price.toLocaleString("vi-VN")} đ
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Mô Tả (Tùy Chọn):</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-select"
                rows={3}
                placeholder="Nhập mô tả bảng học phí..."
                style={{ resize: "vertical" }}
              />
            </div>

            <div
              style={{
                padding: "12px",
                backgroundColor: "#f0f0f0",
                borderRadius: "6px",
                marginBottom: "15px",
                fontWeight: "bold",
              }}
            >
              💰 Tổng Học Phí: {getTotalAmount().toLocaleString("vi-VN")} đ
            </div>

            <button
              type="submit"
              disabled={
                creating || !selectedClass || selectedSubjectIds.length === 0
              }
              className="btn btn-primary"
            >
              {creating ? "Đang xử lý..." : "Tạo Bảng Học Phí"}
            </button>
          </form>
        </div>

        {/* Danh sách bảng học phí */}
        <div style={{ marginTop: "30px" }}>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên ngành..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : filteredTuitions.length === 0 ? (
            <p className="no-data">Chưa có bảng học phí nào.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="profile__table">
                <thead>
                  <tr>
                    <th>Lớp Học</th>
                    <th>Ngành</th>
                    <th>Năm Học</th>
                    <th>Kì Học</th>
                    <th>Số Môn</th>
                    <th>Tổng Học Phí</th>
                    <th>Trạng Thái</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTuitions.map((tuition) => (
                    <React.Fragment key={tuition._id}>
                      <tr>
                        <td>{tuition.classId?.classCode || "N/A"}</td>
                        <td>{tuition.classId?.major || "N/A"}</td>
                        <td>
                          <span
                            style={{
                              backgroundColor: "#e3f2fd",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            {tuition.schoolYear || "N/A"}
                          </span>
                        </td>
                        <td>Kì {tuition.semester}</td>
                        <td>{tuition.subjects?.length || 0}</td>
                        <td>
                          <strong>
                            {tuition.totalAmount.toLocaleString("vi-VN")} đ
                          </strong>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              backgroundColor: tuition.isActive
                                ? "#e8f5e9"
                                : "#ffebee",
                              color: tuition.isActive ? "#2e7d32" : "#c62828",
                              fontSize: "12px",
                            }}
                          >
                            {tuition.isActive ? "✅ Kích Hoạt" : "❌ Vô Hiệu"}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              onClick={() => handleToggleExpand(tuition._id)}
                              style={{
                                padding: "6px 12px",
                                background: "#2196F3",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                              title="Xem/quản lý thanh toán học sinh"
                            >
                              {expandedTuitionId === tuition._id ? "▼" : "▶"}{" "}
                              Học sinh
                            </button>
                            <button
                              onClick={() =>
                                handleGenerateForStudents(tuition._id)
                              }
                              style={{
                                padding: "6px 12px",
                                background: "#4CAF50",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                              title="Tạo bảng học phí cho học sinh của lớp này"
                            >
                              ⚙️ Phân công
                            </button>
                            <button
                              onClick={() =>
                                handleRegenerateForStudents(tuition._id)
                              }
                              style={{
                                padding: "6px 12px",
                                background: "#FF9800",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                              title="Xóa tất cả + tạo lại (nếu phân công báo 0)"
                            >
                              🔄 Tạo lại
                            </button>
                            <button
                              onClick={() =>
                                handleSyncStudentsToClass(tuition.classId._id)
                              }
                              style={{
                                padding: "6px 12px",
                                background: "#9C27B0",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                              title="Đồng bộ tất cả học sinh của lớp này"
                            >
                              🔗 Đồng bộ HS
                            </button>
                            <button
                              onClick={() => handleDeleteTuition(tuition._id)}
                              style={{
                                padding: "6px 12px",
                                background: "#f44336",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Student tuition details row */}
                      {expandedTuitionId === tuition._id && (
                        <tr style={{ backgroundColor: "#f9f9f9" }}>
                          <td colSpan={6} style={{ padding: "20px" }}>
                            {loadingStudents ? (
                              <p>Đang tải danh sách học sinh...</p>
                            ) : studentTuitions.length === 0 ? (
                              <p>Chưa có học sinh nào được gán học phí này.</p>
                            ) : (
                              <div>
                                <h4
                                  style={{
                                    marginBottom: "15px",
                                    color: "#333",
                                  }}
                                >
                                  📚 Danh sách {studentTuitions.length} học sinh
                                </h4>
                                <div style={{ overflowX: "auto" }}>
                                  <table
                                    style={{
                                      width: "100%",
                                      fontSize: "12px",
                                      borderCollapse: "collapse",
                                    }}
                                  >
                                    <thead>
                                      <tr
                                        style={{
                                          backgroundColor: "#e3f2fd",
                                          borderBottom: "2px solid #2196F3",
                                        }}
                                      >
                                        <th
                                          style={{
                                            padding: "10px",
                                            textAlign: "left",
                                          }}
                                        >
                                          Mã HS
                                        </th>
                                        <th
                                          style={{
                                            padding: "10px",
                                            textAlign: "left",
                                          }}
                                        >
                                          Tên học sinh
                                        </th>
                                        <th
                                          style={{
                                            padding: "10px",
                                            textAlign: "center",
                                          }}
                                        >
                                          Năm Học
                                        </th>
                                        <th
                                          style={{
                                            padding: "10px",
                                            textAlign: "center",
                                          }}
                                        >
                                          Kì
                                        </th>
                                        <th
                                          style={{
                                            padding: "10px",
                                            textAlign: "right",
                                          }}
                                        >
                                          Tổng nợ
                                        </th>
                                        <th
                                          style={{
                                            padding: "10px",
                                            textAlign: "right",
                                          }}
                                        >
                                          Đã trả
                                        </th>
                                        <th
                                          style={{
                                            padding: "10px",
                                            textAlign: "right",
                                          }}
                                        >
                                          Còn nợ
                                        </th>
                                        <th
                                          style={{
                                            padding: "10px",
                                            textAlign: "center",
                                          }}
                                        >
                                          Trạng thái
                                        </th>
                                        <th
                                          style={{
                                            padding: "10px",
                                            textAlign: "center",
                                          }}
                                        >
                                          Hành động
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {studentTuitions
                                        .filter(
                                          (st) =>
                                            st.studentId && st.studentId._id,
                                        )
                                        .map((st) => (
                                          <tr
                                            key={st._id}
                                            style={{
                                              borderBottom: "1px solid #ddd",
                                              backgroundColor:
                                                st.status === "paid"
                                                  ? "#f1f8e9"
                                                  : "white",
                                            }}
                                          >
                                            <td style={{ padding: "10px" }}>
                                              {st.studentId?.studentId || "-"}
                                            </td>
                                            <td style={{ padding: "10px" }}>
                                              {st.studentId?.name || "-"}
                                            </td>
                                            <td
                                              style={{
                                                padding: "10px",
                                                textAlign: "center",
                                                fontSize: "12px",
                                                backgroundColor: "#f0f7ff",
                                                fontWeight: "500",
                                              }}
                                            >
                                              {st.schoolYear || "N/A"}
                                            </td>
                                            <td
                                              style={{
                                                padding: "10px",
                                                textAlign: "center",
                                                fontSize: "12px",
                                              }}
                                            >
                                              {st.semester
                                                ? `Kì ${st.semester}`
                                                : "N/A"}
                                            </td>
                                            <td
                                              style={{
                                                padding: "10px",
                                                textAlign: "right",
                                                fontWeight: "bold",
                                              }}
                                            >
                                              {st.totalAmount.toLocaleString(
                                                "vi-VN",
                                              )}{" "}
                                              đ
                                            </td>
                                            <td
                                              style={{
                                                padding: "10px",
                                                textAlign: "right",
                                                color: "#2e7d32",
                                              }}
                                            >
                                              {editingPaymentId === st._id ? (
                                                <input
                                                  type="number"
                                                  value={editingAmount}
                                                  onChange={(e) =>
                                                    setEditingAmount(
                                                      Number(e.target.value),
                                                    )
                                                  }
                                                  style={{
                                                    width: "90px",
                                                    padding: "4px",
                                                    border: "1px solid #ccc",
                                                    borderRadius: "4px",
                                                  }}
                                                />
                                              ) : (
                                                st.paidAmount.toLocaleString(
                                                  "vi-VN",
                                                ) + " đ"
                                              )}
                                            </td>
                                            <td
                                              style={{
                                                padding: "10px",
                                                textAlign: "right",
                                                color:
                                                  st.remainingAmount > 0
                                                    ? "#f44336"
                                                    : "#2e7d32",
                                                fontWeight: "bold",
                                              }}
                                            >
                                              {st.remainingAmount.toLocaleString(
                                                "vi-VN",
                                              )}{" "}
                                              đ
                                            </td>
                                            <td
                                              style={{
                                                padding: "10px",
                                                textAlign: "center",
                                              }}
                                            >
                                              <span
                                                style={{
                                                  display: "inline-block",
                                                  padding: "4px 8px",
                                                  borderRadius: "4px",
                                                  fontSize: "11px",
                                                  fontWeight: "bold",
                                                  backgroundColor:
                                                    st.status === "paid"
                                                      ? "#c8e6c9"
                                                      : st.status === "partial"
                                                        ? "#fff9c4"
                                                        : "#ffcdd2",
                                                  color:
                                                    st.status === "paid"
                                                      ? "#1b5e20"
                                                      : st.status === "partial"
                                                        ? "#f57f17"
                                                        : "#b71c1c",
                                                }}
                                              >
                                                {st.status === "paid"
                                                  ? "✅ Đã trả"
                                                  : st.status === "partial"
                                                    ? "⚠️ Trả một phần"
                                                    : "❌ Chưa trả"}
                                              </span>
                                            </td>
                                            <td
                                              style={{
                                                padding: "10px",
                                                textAlign: "center",
                                              }}
                                            >
                                              {editingPaymentId === st._id ? (
                                                <div
                                                  style={{
                                                    display: "flex",
                                                    gap: "4px",
                                                    justifyContent: "center",
                                                  }}
                                                >
                                                  <button
                                                    onClick={() =>
                                                      handleUpdatePayment(
                                                        st._id,
                                                      )
                                                    }
                                                    style={{
                                                      padding: "4px 8px",
                                                      background: "#4CAF50",
                                                      color: "white",
                                                      border: "none",
                                                      borderRadius: "3px",
                                                      cursor: "pointer",
                                                      fontSize: "11px",
                                                    }}
                                                  >
                                                    💾
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      setEditingPaymentId(null)
                                                    }
                                                    style={{
                                                      padding: "4px 8px",
                                                      background: "#999",
                                                      color: "white",
                                                      border: "none",
                                                      borderRadius: "3px",
                                                      cursor: "pointer",
                                                      fontSize: "11px",
                                                    }}
                                                  >
                                                    ✕
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  onClick={() => {
                                                    setEditingPaymentId(st._id);
                                                    setEditingAmount(
                                                      st.paidAmount,
                                                    );
                                                  }}
                                                  style={{
                                                    padding: "4px 8px",
                                                    background: "#FF9800",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "3px",
                                                    cursor: "pointer",
                                                    fontSize: "11px",
                                                  }}
                                                >
                                                  ✏️ Sửa
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
