import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../../api/axiosConfig";
import "../../../../stylesheets/components/profile/_grades.scss";

interface Major {
  _id: string;
  name: string;
}

interface Subject {
  _id: string;
  name: string;
  price: number;
}

interface Tuition {
  _id: string;
  majorId: Major;
  semester: number;
  subjects: Array<{ subjectId: Subject; price: number }>;
  totalAmount: number;
  description?: string;
  isActive: boolean;
}

export default function TuitionTab() {
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");

  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tuitionsRes, majorsRes, subjectsRes] = await Promise.all([
          axiosInstance.get<{ data: Tuition[] }>("/tuitions"),
          axiosInstance.get<{ data: Major[] }>("/admin/majors"),
          axiosInstance.get<{ data: Subject[] }>("/admin/subjects"),
        ]);

        setTuitions(tuitionsRes.data?.data || []);
        setMajors(majorsRes.data?.data || []);
        setSubjects(subjectsRes.data?.data || []);
      } catch (err) {
        console.error("❌ fetchData error:", err);
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );
  };

  const handleCreateTuition = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMajor || selectedSubjectIds.length === 0) {
      toast.error("Vui lòng chọn ngành và ít nhất 1 môn học");
      return;
    }

    setCreating(true);
    try {
      const res = await axiosInstance.post<{ data: Tuition }>("/tuitions", {
        majorId: selectedMajor,
        semester: parseInt(selectedSemester),
        subjectIds: selectedSubjectIds,
        description,
      });

      if (res.data?.data) {
        setTuitions((prev) => [res.data.data, ...prev]);
        setSelectedMajor("");
        setSelectedSemester("1");
        setSelectedSubjectIds([]);
        setDescription("");
        toast.success("✅ Tạo bảng học phí thành công");
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
        "Bạn muốn tạo bảng học phí cho tất cả học sinh của ngành này?",
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
      }
    } catch (err: any) {
      console.error("❌ Generate tuition error:", err);
      toast.error("Tạo bảng học phí cho học sinh thất bại");
    }
  };

  const getTotalAmount = () => {
    return selectedSubjectIds.reduce((sum, subjectId) => {
      const subject = subjects.find((s) => s._id === subjectId);
      return sum + (subject?.price || 0);
    }, 0);
  };

  const filteredTuitions = tuitions.filter((t) =>
    t.majorId?.name.toLowerCase().includes(search.toLowerCase()),
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
              <label>Chọn Ngành:</label>
              <select
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                className="form-select"
              >
                <option value="">-- Chọn ngành --</option>
                {majors.map((major) => (
                  <option key={major._id} value={major._id}>
                    {major.name}
                  </option>
                ))}
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
                creating || !selectedMajor || selectedSubjectIds.length === 0
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
                    <th>Ngành</th>
                    <th>Kì Học</th>
                    <th>Số Môn</th>
                    <th>Tổng Học Phí</th>
                    <th>Trạng Thái</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTuitions.map((tuition) => (
                    <tr key={tuition._id}>
                      <td>{tuition.majorId?.name || "N/A"}</td>
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
                        <div style={{ display: "flex", gap: "8px" }}>
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
                            title="Tạo bảng học phí cho học sinh của ngành này"
                          >
                            ⚙️ Phân công
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
