// src/pages/Profile/admin/Class/CreateClass.tsx
import React, { useState, useEffect } from "react";
import { ICreatedStudent } from "../../../../types/student";
import axiosInstance from "../../../../api/axiosConfig";
import { createClass } from "./settings/createClassAPI";
import { updateClass } from "./settings/updateClassAPI";
import { getClasses } from "./settings/getClassesAPI";
import { deleteClass } from "./settings/deleteClassAPI";
import { toast, Toaster } from "react-hot-toast";
import { generateClassCode } from "../../../../../server/helpers/classCode";
import { ObjectId } from "mongodb";

interface ClassType {
  _id: string | ObjectId;
  grade: string;
  schoolYear: string;
  classLetter: string;
  major: string;
  classCode: string;
}

const CreateClass: React.FC = () => {
  const [formData, setFormData] = useState({
    grade: "",
    schoolYear: "",
    classLetter: "",
    major: "",
    classCode: "",
  });

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch danh sách lớp
  const fetchClasses = async () => {
    try {
      const res = await getClasses();
      if (res && res.success && Array.isArray(res.data)) {
        setClasses(res.data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách lớp!");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Cập nhật formData và tự sinh classCode
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (["grade", "classLetter", "major"].includes(name)) {
        updated.classCode = generateClassCode(
          updated.grade,
          updated.classLetter,
          updated.major,
        );
      }
      return updated;
    });
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.grade.trim() ||
      !formData.schoolYear.trim() ||
      !formData.classLetter.trim() ||
      !formData.classCode.trim()
    ) {
      toast.error(" Vui lòng nhập đủ thông tin!");
      return;
    }

    const payload = { ...formData };

    setLoading(true);
    try {
      const res =
        editingId !== null
          ? await updateClass(editingId, payload)
          : await createClass(payload);

      if (res && res.success) {
        toast.success(
          editingId ? "Cập nhật thành công!" : "Tạo lớp thành công!",
        );
        await fetchClasses();
        setFormData({
          grade: "",
          schoolYear: "",
          classLetter: "",
          major: "",
          classCode: "",
        });
        setEditingId(null);
      } else {
        toast.error(res?.message || "❌ Lỗi tạo/cập nhật lớp!");
      }
    } catch (err: any) {
      console.error("Lỗi khi tạo/cập nhật lớp:", err);
      toast.error("Lỗi máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  // Xóa lớp
  const handleDelete = async (id: string | ObjectId) => {
    if (!window.confirm("Xóa lớp này?")) return;
    try {
      const res = await deleteClass(id.toString());
      if (res?.success) {
        toast.success("🗑️ Đã xóa lớp");
        fetchClasses();
      } else {
        toast.error("Xóa thất bại!");
      }
    } catch (error) {
      toast.error("Lỗi khi xóa lớp!");
    }
  };

  return (
    <div className="p-6">
      <Toaster position="top-right" reverseOrder={false} />
      <h2 className="text-xl font-semibold mb-4">Quản lý lớp học</h2>

      <form onSubmit={handleSubmit} className="grid gap-3 mb-6">
        <input
          type="text"
          name="grade"
          placeholder="Khối (VD: 10, 11, 12)"
          value={formData.grade}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="schoolYear"
          placeholder="Năm học (VD: 2024-2025)"
          value={formData.schoolYear}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="classLetter"
          placeholder="Tên lớp (VD: A, B, C)"
          value={formData.classLetter}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="major"
          placeholder="Chuyên ngành (VD: Toán, Văn, Anh)"
          value={formData.major}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="classCode"
          placeholder="Mã lớp tự sinh"
          value={formData.classCode}
          readOnly
          className="border p-2 rounded bg-gray-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo lớp"}
        </button>
      </form>

      <hr className="my-6" />

      {classes.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Chưa có lớp nào!</p>
      ) : (
        <ul className="space-y-2">
          {classes.map((cls) => (
            <li
              key={cls._id?.toString()}
              className="border rounded p-3 flex justify-between items-center"
            >
              <span>
                {cls.grade}
                {cls.classLetter} - {cls.major} ({cls.schoolYear}) [
                {cls.classCode}]
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setFormData({
                      grade: cls.grade,
                      schoolYear: cls.schoolYear,
                      classLetter: cls.classLetter,
                      major: cls.major,
                      classCode: cls.classCode,
                    });
                    setEditingId(cls._id?.toString() || null);
                  }}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(cls._id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CreateClass;
