import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2 } from "lucide-react";
import { createClass } from "./settings/createClassAPI";
import { updateClass } from "./settings/updateClassAPI";
import { deleteClass } from "./settings/deleteClassAPI";
import { getAllClasses } from "./settings/getClassesAPI";

export interface IClass {
  _id: string;
  grade: string;
  schoolYear: string;
  classLetter: string;
  major?: string;
  classCode: string;
  className?: string;
}

interface ClassResponse {
  success: boolean;
  message?: string;
  data?: IClass[];
}

const CreateClass: React.FC = () => {
  const [formData, setFormData] = useState({
    grade: "",
    schoolYear: "",
    classLetter: "",
    major: "",
    classCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<IClass[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchClasses = async () => {
    try {
      const res: ClassResponse = await getAllClasses();
      if (res.success) setClasses(res.data || []);
      else toast.error(res.message || "Không thể tải danh sách lớp!");
    } catch (error: any) {
      console.error("❌ Lỗi khi tải lớp:", error);
      toast.error("Không thể tải danh sách lớp!");
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.grade.trim() ||
      !formData.schoolYear.trim() ||
      !formData.classLetter.trim() ||
      !formData.classCode.trim()
    ) {
      toast.warn("⚠️ Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }
    setLoading(true);
    try {
      const resData: ClassResponse = editingId
        ? await updateClass(editingId, formData)
        : await createClass(formData);

      if (resData.success) {
        toast.success(
          editingId ? "✅ Cập nhật lớp thành công!" : "✅ Tạo lớp thành công!",
        );
        setFormData({
          grade: "",
          schoolYear: "",
          classLetter: "",
          major: "",
          classCode: "",
        });
        setEditingId(null);
        await fetchClasses();
      } else toast.error(resData.message || "❌ Lỗi khi lưu lớp!");
    } catch (error: any) {
      console.error("⚠️ Lỗi khi lưu:", error);
      toast.error(error?.response?.data?.message || "Lỗi máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá lớp này?")) return;
    try {
      const res: ClassResponse = await deleteClass(id);
      if (res.success) {
        toast.success("🗑️ Xoá lớp thành công!");
        setClasses((prev) => prev.filter((c) => c._id !== id));
      } else toast.error(res.message || "Không thể xoá lớp!");
    } catch (error: any) {
      console.error("❌ Lỗi khi xoá lớp:", error);
      toast.error("Không thể xoá lớp!");
    }
  };

  const handleEdit = (cls: IClass) => {
    setEditingId(cls._id);
    setFormData({
      grade: cls.grade,
      schoolYear: cls.schoolYear,
      classLetter: cls.classLetter,
      major: cls.major || "",
      classCode: cls.classCode,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-6 w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-5 text-center text-gray-700">
        🏫 {editingId ? "Chỉnh sửa lớp học" : "Tạo lớp học mới"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {["grade", "schoolYear", "classLetter", "major", "classCode"].map(
          (field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">
                {field === "grade"
                  ? "Khối (grade)"
                  : field === "schoolYear"
                    ? "Năm học"
                    : field === "classLetter"
                      ? "Lớp (chữ)"
                      : field === "major"
                        ? "Ngành học"
                        : "Mã lớp"}
              </label>
              <input
                type="text"
                name={field}
                value={(formData as Record<string, string>)[field]}
                onChange={handleChange}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                placeholder={
                  field === "grade"
                    ? "VD: 10, 11, 12"
                    : field === "schoolYear"
                      ? "VD: 2024-2025"
                      : field === "classLetter"
                        ? "VD: A, B, C..."
                        : field === "major"
                          ? "VD: CNTT, Toán, Văn..."
                          : "VD: 12A1"
                }
                required={[
                  "grade",
                  "schoolYear",
                  "classLetter",
                  "classCode",
                ].includes(field)}
              />
            </div>
          ),
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 font-medium text-white rounded-lg transition ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {loading ? "Đang xử lý..." : editingId ? "Cập nhật lớp" : "Tạo lớp"}
        </button>
      </form>

      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">
          📋 Danh sách lớp học
        </h3>
        {classes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Chưa có lớp nào!</p>
        ) : (
          <div className="gridContainer">
            {classes.map((cls, i) => {
              const divClass = `div${(i % 5) + 1}`;
              return (
                <div key={cls._id} className={`classItem ${divClass}`}>
                  <div>
                    <p>
                      <strong>Khối:</strong> {cls.grade}
                    </p>
                    <p>
                      <strong>Mã lớp:</strong> {cls.classCode}
                    </p>
                    <p>
                      <strong>Năm học:</strong> {cls.schoolYear}
                    </p>
                    <p>
                      <strong>Ngành:</strong> {cls.major || "-"}
                    </p>
                    <p>
                      <strong>Lớp:</strong> {cls.classLetter}
                    </p>
                  </div>
                  <div className="actions">
                    <button
                      onClick={() => handleEdit(cls)}
                      className="editButton"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(cls._id)}
                      className="deleteButton"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateClass;
