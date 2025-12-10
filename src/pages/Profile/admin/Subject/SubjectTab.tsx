import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../../api/axiosConfig";

interface Subject {
  _id: string;
  name: string;
  price: number;
  classId: string;
  createdAt?: string;
}

interface SubjectForm {
  name: string;
  price: number;
  classId: string;
}

export default function SubjectTab() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState<SubjectForm>({
    name: "",
    price: 0,
    classId: "",
  });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch danh sách lớp
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axiosInstance.get<{ data: any[] }>("/classes");
        setClasses(res.data?.data || []);
      } catch (err) {
        console.error("fetchClasses error:", err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch danh sách môn học
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get<{ data: Subject[] }>("/subjects");
        setSubjects(res.data?.data || []);
      } catch (err) {
        console.error("fetchSubjects error:", err);
        toast.error("Lỗi tải danh sách môn học");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.classId) {
      toast.error("Vui lòng nhập tên môn học và chọn lớp");
      return;
    }

    setCreating(true);
    try {
      const res = await axiosInstance.post<{ subject: Subject }>(
        "/subjects",
        form,
      );
      const newSubject = res.data?.subject;
      if (newSubject) {
        setSubjects((prev) => [...prev, newSubject]);
        setForm({ name: "", price: 0, classId: "" });
        toast.success("Tạo môn học thành công");
      }
    } catch (err: any) {
      console.error("handleCreateSubject error:", err);
      toast.error(err.response?.data?.message || "Tạo môn học thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa môn học này?")) return;

    try {
      const res = await axiosInstance.delete<{ message: string }>(
        `/subjects/${subjectId}`,
      );
      if (res.data?.message) {
        setSubjects((prev) => prev.filter((s) => s._id !== subjectId));
        toast.success("Xóa môn học thành công");
      }
    } catch (err: any) {
      console.error("handleDeleteSubject error:", err);
      toast.error("Xóa môn học thất bại");
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.price.toString().includes(search),
  );

  return (
    <div className="profile__card">
      <h2 className="profile__title">Quản lý môn học</h2>

      {/* Form tạo môn học */}
      <form onSubmit={handleCreateSubject} className="form">
        <div className="form-group">
          <label>Tên môn học:</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ví dụ: Toán, Văn, Anh..."
            required
          />
        </div>

        <div className="form-group">
          <label>Học phí (VND):</label>
          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Nhập học phí"
            min="0"
            step="1000"
            required
          />
        </div>

        <button type="submit" disabled={creating} className="button">
          {creating ? "Đang tạo..." : "Tạo môn học"}
        </button>
      </form>

      {/* Search */}
      <div className="search-bar mb-2">
        <input
          type="text"
          placeholder="Tìm kiếm môn học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Danh sách môn học */}
      {loading ? (
        <p>Đang tải môn học...</p>
      ) : filteredSubjects.length === 0 ? (
        <p className="no-data">Chưa có môn học nào.</p>
      ) : (
        <table className="profile__table">
          <thead>
            <tr>
              <th>Tên môn học</th>
              <th>Học phí (VND)</th>

              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.map((subject) => {
              const cls = classes.find((c) => c._id === subject.classId);
              return (
                <tr key={subject._id}>
                  <td>{subject.name}</td>
                  <td>{subject.price.toLocaleString("vi-VN")}</td>

                  <td>
                    {subject.createdAt
                      ? new Date(subject.createdAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteSubject(subject._id)}
                      className="action-btn delete"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
