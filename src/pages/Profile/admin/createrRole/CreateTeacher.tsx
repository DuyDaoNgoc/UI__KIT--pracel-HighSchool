import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../api/axiosConfig";
import { toast, Toaster } from "react-hot-toast";
import toastr from "toastr";
interface ITeacher {
  _id: string;
  teacherId?: string;
  name: string;
  dob?: string;
  gender: "Nam" | "Nữ" | "other";
  phone?: string;
  address?: string;
  degree?: string;
  educationLevel?: string;
  majors?: string[];
  certificates?: string[];
  research?: string;
}

// 👇 Form type: majors & certificates là string để bind input
interface ITeacherForm {
  teacherId: string;
  name: string;
  dob: string;
  gender: "Nam" | "Nữ" | "other";
  phone: string;
  address: string;
  degree: string;
  educationLevel: string;
  majors: string;
  certificates: string;
  research: string;
}

export default function CreateTeacherWithTable() {
  const [form, setForm] = useState<ITeacherForm>({
    teacherId: "",
    name: "",
    dob: "",
    gender: "Nam",
    phone: "",
    address: "",
    degree: "",
    educationLevel: "",
    majors: "",
    certificates: "",
    research: "",
  });
  toastr.options = {
    closeButton: true,
    progressBar: true,
    timeOut: 3000,
    positionClass: "toast-bottom-right", // góc dưới phải
  };
  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ✅ Sửa ở đây: backend trả về mảng trực tiếp
  const fetchTeachers = async () => {
    try {
      const res = await axiosInstance.get<ITeacher[]>("/teachers");
      const data = res.data || [];

      const normalized = data.map((t) => ({
        ...t,
        dob: t.dob ? t.dob.split("T")[0] : "",
        majors: t.majors || [],
        certificates: t.certificates || [],
      }));
      setTeachers(normalized);
    } catch (err) {
      console.error("❌Lỗi lấy danh sách giáo viên:", err);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      teacherId: "",
      name: "",
      dob: "",
      gender: "Nam",
      phone: "",
      address: "",
      degree: "",
      educationLevel: "",
      majors: "",
      certificates: "",
      research: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Chuyển majors, certificates từ string -> string[]
    const payload: Omit<ITeacher, "_id"> = {
      teacherId: form.teacherId || undefined,
      name: form.name,
      dob: form.dob || undefined,
      gender: form.gender,
      phone: form.phone || undefined,
      address: form.address || undefined,
      degree: form.degree || undefined,
      educationLevel: form.educationLevel || undefined,
      majors: form.majors ? form.majors.split(",").map((m) => m.trim()) : [],
      certificates: form.certificates
        ? form.certificates.split(",").map((c) => c.trim())
        : [],
      research: form.research || undefined,
    };

    try {
      if (editingId) {
        await axiosInstance.put(`/teachers/${editingId}`, payload);
        toast.success(" Cập nhật giáo viên thành công!");
      } else {
        await axiosInstance.post("/teachers", payload);
        toast.success(" Thêm giáo viên thành công!");
      }
      resetForm();
      fetchTeachers();
    } catch (error) {
      console.error("❌ Lỗi khi gửi dữ liệu:", error);
      toast.error("Vui lòng nhập đầy đủ.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xoá giáo viên này?")) return;
    try {
      await axiosInstance.delete(`/teachers/${id}`);
      toast.success("Xoá giáo viên thành công!");
      fetchTeachers();
    } catch (err) {
      console.error("❌ Lỗi xoá giáo viên:", err);
      toast.error(" Lỗi khi xoá giáo viên.");
    }
  };

  const handleEdit = (teacher: ITeacher) => {
    setEditingId(teacher._id);
    setForm({
      teacherId: teacher.teacherId || "",
      name: teacher.name,
      dob: teacher.dob || "",
      gender: teacher.gender,
      phone: teacher.phone || "",
      address: teacher.address || "",
      degree: teacher.degree || "",
      educationLevel: teacher.educationLevel || "",
      majors: teacher.majors?.join(", ") || "",
      certificates: teacher.certificates?.join(", ") || "",
      research: teacher.research || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="teacher">
      <h2 className="teacher__title">
        {editingId ? "Cập nhật giáo viên" : "Tạo giáo viên mới"}
      </h2>

      <form className="teacher-form" onSubmit={handleSubmit} noValidate>
        {form.teacherId && (
          <input
            className="teacher-form__input"
            name="teacherId"
            value={form.teacherId}
            readOnly
            disabled
          />
        )}
        <input
          className="teacher-form__input"
          name="name"
          placeholder="Tên"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="teacher-form__input"
          type="date"
          name="dob"
          value={form.dob}
          onChange={handleChange}
          required
        />
        <select
          className="teacher-form__select"
          name="gender"
          value={form.gender}
          onChange={handleChange}
        >
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
          <option value="other">Khác</option>
        </select>
        <input
          className="teacher-form__input"
          name="phone"
          placeholder="Số điện thoại"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          className="teacher-form__input"
          name="address"
          placeholder="Địa chỉ"
          value={form.address}
          onChange={handleChange}
        />
        <input
          className="teacher-form__input"
          name="degree"
          placeholder="Bằng cấp"
          value={form.degree}
          onChange={handleChange}
        />
        <input
          className="teacher-form__input"
          name="educationLevel"
          placeholder="Trình độ học vấn"
          value={form.educationLevel}
          onChange={handleChange}
        />
        <input
          className="teacher-form__input"
          name="majors"
          placeholder="Chuyên ngành (cách nhau dấu ,)"
          value={form.majors}
          onChange={handleChange}
        />
        <input
          className="teacher-form__input"
          name="certificates"
          placeholder="Chứng chỉ (cách nhau dấu ,)"
          value={form.certificates}
          onChange={handleChange}
        />
        <textarea
          className="teacher-form__textarea"
          name="research"
          placeholder="Nghiên cứu / Kinh nghiệm"
          value={form.research}
          onChange={handleChange}
        />
        <div className="teacher-form__actions">
          <button className="teacher-form__button" type="submit">
            {editingId ? "Cập nhật" : "Tạo giáo viên"}
          </button>
          {editingId && (
            <button
              type="button"
              className="teacher-form__button teacher-form__button--cancel"
              onClick={resetForm}
            >
              Huỷ
            </button>
          )}
        </div>
      </form>

      <h2 className="teacher__title">Danh sách giáo viên</h2>
      <table className="teacher-table">
        <thead className="teacher-table__head">
          <tr>
            <th className="teacher-table__cell">Mã GV</th>
            <th className="teacher-table__cell">Tên</th>
            <th className="teacher-table__cell">Ngày sinh</th>
            <th className="teacher-table__cell">Giới tính</th>
            <th className="teacher-table__cell">Bằng cấp</th>
            <th className="teacher-table__cell">Trình độ</th>
            <th className="teacher-table__cell">Chuyên ngành</th>
            <th className="teacher-table__cell">Chứng chỉ</th>
            <th className="teacher-table__cell">Nghiên cứu / Kinh nghiệm</th>
            <th className="teacher-table__cell">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => (
            <tr key={t._id} className="teacher-table__row">
              <td className="teacher-table__cell">{t.teacherId || "---"}</td>
              <td className="teacher-table__cell">{t.name}</td>
              <td className="teacher-table__cell">{t.dob}</td>
              <td className="teacher-table__cell">{t.gender}</td>
              <td className="teacher-table__cell">{t.degree}</td>
              <td className="teacher-table__cell">{t.educationLevel}</td>
              <td className="teacher-table__cell">
                {t.majors?.join(", ") || ""}
              </td>
              <td className="teacher-table__cell">
                {t.certificates?.join(", ") || ""}
              </td>
              <td className="teacher-table__cell">{t.research}</td>
              <td className="teacher-table__cell">
                <button
                  className="teacher-table__button teacher-table__button--edit"
                  onClick={() => handleEdit(t)}
                >
                  Sửa
                </button>
                <button
                  className="teacher-table__button teacher-table__button--delete"
                  onClick={() => handleDelete(t._id)}
                >
                  Xoá
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
