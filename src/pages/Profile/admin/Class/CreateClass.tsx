import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2 } from "lucide-react";
import { createClass } from "./settings/createClassAPI";
import { updateClass } from "./settings/updateClassAPI";
import { deleteClass } from "./settings/deleteClassAPI";
import { getAllClasses } from "./settings/getClassesAPI";
import http from "../../../../api/axiosConfig";

export interface IClass {
  _id: string;
  grade: string;
  schoolYear: string;
  classLetter: string;
  major?: string;
  classCode: string;
  className?: string;
  teacherId?: string;
  studentIds?: string[];
}

interface ClassResponse {
  success: boolean;
  message?: string;
  data?: IClass[];
}

interface ITeacher {
  _id: string;
  name: string;
  teacherId?: string;
}

interface IStudent {
  _id: string;
  name: string;
  studentId?: string;
  grade?: string;
  classLetter?: string;
  major?: string;
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

  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [students, setStudents] = useState<IStudent[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | "">("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    console.log("CreateClass mounted");
    fetchClasses();
    fetchTeachers();
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClasses = async () => {
    try {
      const res: ClassResponse = await getAllClasses();
      if (res && res.success && Array.isArray(res.data)) setClasses(res.data);
      else setClasses([]);
    } catch (error: any) {
      console.error("❌ Lỗi khi tải lớp:", error);
      toast.error("Không thể tải danh sách lớp!");
      setClasses([]);
    }
  };

  const safeArrayFromResponse = <T,>(res: any): T[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    return [];
  };

  const fetchTeachers = async () => {
    try {
      const res: any = await http.get("/teachers");
      setTeachers(safeArrayFromResponse<ITeacher>(res));
    } catch (err) {
      console.error("❌ Lỗi lấy giáo viên:", err);
      setTeachers([]);
    }
  };

  const fetchStudents = async () => {
    try {
      const res: any = await http.get("/students");
      setStudents(safeArrayFromResponse<IStudent>(res));
    } catch (err) {
      console.error("❌ Lỗi lấy học sinh:", err);
      setStudents([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const normalizeIdsToObjectIds = (ids?: string[]) => {
    if (!ids || ids.length === 0) return [];
    return ids.map((id) => {
      const byId = students.find((s) => s._id === id);
      if (byId) return byId._id;
      const byStudentId = students.find((s) => s.studentId === id);
      if (byStudentId) return byStudentId._id;
      return id;
    });
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
      const payload = {
        ...formData,
        teacherId: selectedTeacherId || undefined,
        studentIds: selectedStudentIds.length ? selectedStudentIds : undefined,
      };

      const resData: ClassResponse = editingId
        ? await updateClass(editingId, payload)
        : await createClass(payload);

      if (resData.success) {
        toast.success(
          editingId ? "✅ Cập nhật lớp thành công!" : "✅ Tạo lớp thành công!",
        );
        // reset
        setFormData({
          grade: "",
          schoolYear: "",
          classLetter: "",
          major: "",
          classCode: "",
        });
        setEditingId(null);
        setSelectedTeacherId("");
        setSelectedStudentIds([]);
        await fetchClasses();
      } else {
        toast.error(resData.message || "❌ Lỗi khi lưu lớp!");
      }
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
      const res = await deleteClass(id);
      if (res.success) {
        toast.success("🗑️ Xoá lớp thành công!");
        setClasses((prev) => prev.filter((c) => c._id !== id));
      } else {
        toast.error(res.message || "Không thể xoá lớp!");
      }
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
    setSelectedTeacherId(cls.teacherId || "");
    setSelectedStudentIds(normalizeIdsToObjectIds(cls.studentIds || []));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getTeacherName = (id?: string) =>
    teachers.find((t) => t._id === id)?.name ||
    teachers.find((t) => t.teacherId === id)?.name ||
    "-";

  return (
    <div className="p-6 w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg mt-10">
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

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Giáo viên chủ nhiệm (tuỳ chọn)
          </label>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
          >
            <option value="">-- Chọn giáo viên --</option>
            {Array.isArray(teachers) &&
              teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} {t.teacherId ? `(${t.teacherId})` : ""}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Gán học sinh vào lớp (tuỳ chọn)
          </label>
          <div className="students-checkbox-list max-h-48 overflow-auto border rounded-lg p-2">
            {Array.isArray(students) && students.length > 0 ? (
              students.map((s) => {
                const checked =
                  selectedStudentIds.includes(s._id) ||
                  (s.studentId
                    ? selectedStudentIds.includes(s.studentId)
                    : false);
                return (
                  <label
                    key={s._id}
                    className="flex items-center gap-2 text-sm p-1 hover:bg-gray-50 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleStudent(s._id)}
                    />
                    <span>
                      {s.name} {s.studentId ? `(${s.studentId})` : ""}
                    </span>
                  </label>
                );
              })
            ) : (
              <p className="text-gray-500">Chưa có học sinh</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 font-medium text-white rounded-lg transition ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Đang xử lý..." : editingId ? "Cập nhật lớp" : "Tạo lớp"}
        </button>
      </form>

      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">
          📋 Danh sách lớp học
        </h3>
        {Array.isArray(classes) && classes.length > 0 ? (
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
                    <p>
                      <strong>GVCN:</strong> {getTeacherName(cls.teacherId)}
                    </p>
                    <p>
                      <strong>Số HS:</strong>{" "}
                      {Array.isArray(cls.studentIds)
                        ? cls.studentIds.length
                        : 0}
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
        ) : (
          <p className="text-gray-500 text-center py-4">Chưa có lớp nào!</p>
        )}
      </div>
    </div>
  );
};

export default CreateClass;
