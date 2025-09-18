// src/pages/Profile/admin/CreateTeacher.tsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { IClass } from "../../../types/class";

interface ITeacherForm {
  name: string;
  dob: string;
  gender: string;
  phone?: string;
  address?: string;
  majors: string[];
  assignedClassCode: string; // lớp chủ nhiệm
  subjectClasses: string[];
}

interface ITeacherCreated extends ITeacherForm {
  _id: string;
}

export default function CreateTeacher() {
  const [teacherForm, setTeacherForm] = useState<ITeacherForm>({
    name: "",
    dob: "",
    gender: "male",
    phone: "",
    address: "",
    majors: [],
    assignedClassCode: "",
    subjectClasses: [],
  });

  const [majors, setMajors] = useState<string[]>([]);
  const [classesByMajor, setClassesByMajor] = useState<
    Record<string, IClass[]>
  >({});
  const [teachers, setTeachers] = useState<ITeacherCreated[]>([]);
  const [loading, setLoading] = useState(false);

  // load lớp & ngành
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axiosInstance.get<IClass[]>("/api/admin/classes");
        const classes = Array.isArray(res.data) ? res.data : [];
        const uniqueMajors = Array.from(
          new Set(classes.map((c) => c.major).filter(Boolean))
        ) as string[];
        setMajors(uniqueMajors);

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
    const { name, value, selectedOptions } = e.target as HTMLSelectElement;
    if (name === "majors") {
      const selected = Array.from(selectedOptions).map((o) => o.value);
      setTeacherForm((prev) => ({
        ...prev,
        majors: selected,
        assignedClassCode: "",
        subjectClasses: [],
      }));
    } else if (name === "subjectClasses") {
      const selected = Array.from(selectedOptions).map((o) => o.value);
      setTeacherForm((prev) => ({ ...prev, subjectClasses: selected }));
    } else {
      setTeacherForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const filteredClassesForMain = teacherForm.majors.length
    ? teacherForm.majors.flatMap((major) => classesByMajor[major] || [])
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      name,
      dob,
      gender,
      majors,
      assignedClassCode,
      subjectClasses,
      phone,
      address,
    } = teacherForm;

    if (!name || !dob || !gender || majors.length === 0 || !assignedClassCode) {
      return alert("Vui lòng điền đầy đủ thông tin và chọn lớp chủ nhiệm.");
    }

    try {
      setLoading(true);

      // 1️⃣ Tạo teacher
      const createRes = await axiosInstance.post<{ _id: string }>(
        "/api/admin/teachers/create",
        {
          name,
          dob,
          gender,
          phone,
          address,
          majors,
          subjectClasses,
        }
      );

      const teacherId = createRes.data._id;

      // 2️⃣ Gán teacher vào lớp chủ nhiệm
      await axiosInstance.post(
        "/api/admin/teachers/assign",
        {
          teacherId,
          grade: filteredClassesForMain.find(
            (c) => c.classCode === assignedClassCode
          )?.grade,
          classLetter: filteredClassesForMain.find(
            (c) => c.classCode === assignedClassCode
          )?.classLetter,
          schoolYear: filteredClassesForMain.find(
            (c) => c.classCode === assignedClassCode
          )?.schoolYear,
          major: filteredClassesForMain.find(
            (c) => c.classCode === assignedClassCode
          )?.major,
        },
        { params: { classCode: assignedClassCode } }
      );

      // 3️⃣ Cập nhật state UI
      setTeachers((prev) => [{ _id: teacherId, ...teacherForm }, ...prev]);

      setTeacherForm({
        name: "",
        dob: "",
        gender: "male",
        phone: "",
        address: "",
        majors: [],
        assignedClassCode: "",
        subjectClasses: [],
      });

      alert(`✅ Giáo viên ${name} đã được tạo và đồng bộ lớp thành công!`);
    } catch (err) {
      console.error("⚠️ createTeacher error:", err);
      alert("Tạo giáo viên thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile__card">
      <h2 className="profile__title">Tạo giáo viên</h2>
      <form onSubmit={handleSubmit}>
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

        <div className="form-group">
          <label>Ngành phụ trách:</label>
          <select
            name="majors"
            multiple
            value={teacherForm.majors}
            onChange={handleChange}
            required
          >
            {majors.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Lớp chủ nhiệm:</label>
          <select
            name="assignedClassCode"
            value={teacherForm.assignedClassCode}
            onChange={handleChange}
            required
            disabled={filteredClassesForMain.length === 0}
          >
            <option value="">-- Chọn lớp chủ nhiệm --</option>
            {filteredClassesForMain.map((cls) => (
              <option key={cls.classCode} value={cls.classCode}>
                {cls.grade}
                {cls.classLetter} -{" "}
                {cls.teacherName ? `GV: ${cls.teacherName}` : "Chưa gán"}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Lớp phụ trách bộ môn:</label>
          <select
            name="subjectClasses"
            multiple
            value={teacherForm.subjectClasses}
            onChange={handleChange}
          >
            {filteredClassesForMain.map((cls) => (
              <option
                key={cls.classCode}
                value={cls.classCode}
                disabled={cls.classCode === teacherForm.assignedClassCode}
              >
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
    </div>
  );
}
