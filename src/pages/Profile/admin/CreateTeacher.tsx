import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { IClass } from "../../../types/class";

interface ITeacher {
  teacherId?: string;
  name: string;
  dob: string;
  gender: string;
  phone?: string;
  address?: string;
  major: string;
  classCode: string;
  createdAt?: Date;
}

export default function CreateTeacher() {
  const [teacherForm, setTeacherForm] = useState<ITeacher>({
    name: "",
    dob: "",
    gender: "male",
    phone: "",
    address: "",
    major: "",
    classCode: "",
  });

  const [majors, setMajors] = useState<string[]>([]);
  const [classesByMajor, setClassesByMajor] = useState<
    Record<string, IClass[]>
  >({});
  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [loading, setLoading] = useState(false);

  // ==== Load tất cả lớp & nhóm ngành ====
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axiosInstance.get<IClass[]>("/api/admin/classes");
        const classes = Array.isArray(res.data) ? res.data : [];

        // Lấy danh sách ngành duy nhất
        const uniqueMajors = Array.from(
          new Set(classes.map((c) => c.major).filter(Boolean))
        ) as string[];
        setMajors(uniqueMajors);

        // Nhóm lớp theo ngành
        const grouped: Record<string, IClass[]> = {};
        uniqueMajors.forEach((major) => {
          grouped[major] = classes.filter((c) => c.major === major);
        });
        setClassesByMajor(grouped);
      } catch (err) {
        console.error("⚠️ fetchClasses error:", err);
      }
    };
    fetchClasses();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTeacherForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "major" ? { classCode: "" } : {}),
    }));
  };

  const filteredClasses = teacherForm.major
    ? classesByMajor[teacherForm.major] || []
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { name, dob, gender, phone, address, major, classCode } = teacherForm;
    if (!name || !dob || !gender || !major || !classCode)
      return alert("Vui lòng điền đầy đủ thông tin và chọn lớp phụ trách.");

    try {
      setLoading(true);

      // 1️⃣ Tạo giáo viên (chưa có tài khoản, chỉ lưu thông tin)
      const res = await axiosInstance.post<ITeacher>(
        "/api/admin/teachers/create",
        {
          name,
          dob,
          gender,
          phone,
          address,
          major,
          classCode,
        }
      );

      // 2️⃣ Cập nhật danh sách giáo viên mới
      setTeachers((prev) => [res.data, ...prev]);

      // 3️⃣ Reset form
      setTeacherForm({
        name: "",
        dob: "",
        gender: "male",
        phone: "",
        address: "",
        major: "",
        classCode: "",
      });

      alert(
        `✅ Giáo viên ${name} đã được tạo và gán làm chủ nhiệm lớp ${classCode} thành công!`
      );
    } catch (err) {
      console.error("⚠️ createTeacher error:", err);
      alert("Tạo giáo viên thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile__card">
      <h2 className="profile__title">Tạo giáo viên chủ nhiệm</h2>
      <form onSubmit={handleSubmit}>
        {/* Thông tin cơ bản */}
        {["name", "dob", "phone", "address"].map((field) => (
          <div className="form-group" key={field}>
            <label>
              {field === "dob"
                ? "Ngày sinh"
                : field.charAt(0).toUpperCase() + field.slice(1)}
              :
            </label>
            <input
              type={field === "dob" ? "date" : "text"}
              name={field}
              value={(teacherForm as any)[field]}
              onChange={handleChange}
              required={field === "name" || field === "dob"}
            />
          </div>
        ))}

        {/* Giới tính */}
        <div className="form-group">
          <label>Giới tính:</label>
          <select
            name="gender"
            value={teacherForm.gender}
            onChange={handleChange}
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>

        {/* Ngành */}
        <div className="form-group">
          <label>Ngành phụ trách:</label>
          <select
            name="major"
            value={teacherForm.major}
            onChange={handleChange}
            required
          >
            <option value="">-- Chọn ngành --</option>
            {majors.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Lớp */}
        <div className="form-group">
          <label>Chọn lớp phụ trách:</label>
          <select
            name="classCode"
            value={teacherForm.classCode}
            onChange={handleChange}
            required
            disabled={!teacherForm.major || filteredClasses.length === 0}
          >
            <option value="">-- Chọn lớp --</option>
            {filteredClasses.map((cls) => (
              <option key={cls.classCode} value={cls.classCode}>
                {cls.grade}
                {cls.classLetter} -{" "}
                {cls.teacherName ? `GV: ${cls.teacherName}` : "Chưa gán"}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Đang tạo..." : "Tạo giáo viên"}
        </button>
      </form>

      {/* Danh sách giáo viên vừa tạo */}
      {teachers.length > 0 && (
        <div className="mt-4">
          <h3>Danh sách giáo viên chủ nhiệm</h3>
          <table className="profile__table mt-2">
            <thead>
              <tr>
                <th>Tên GV</th>
                <th>Ngày sinh</th>
                <th>Giới tính</th>
                <th>Ngành</th>
                <th>Lớp chủ nhiệm</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, idx) => (
                <tr key={idx}>
                  <td>{t.name}</td>
                  <td>{t.dob}</td>
                  <td>{t.gender}</td>
                  <td>{t.major}</td>
                  <td>{t.classCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
