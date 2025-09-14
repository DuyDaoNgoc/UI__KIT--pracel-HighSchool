// src/pages/Profile/admin/AdminProfile.tsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { INews } from "../../../types/news";
import type {} from "react/jsx-runtime";
import {
  Lock,
  Unlock,
  FileText,
  UserPlus,
  Users,
  Eye,
  Trash2,
  UserPlus2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

interface ILockResp {
  locked: boolean;
}

// Kiểu học sinh phía client (lịch sử / danh sách)
interface ICreatedStudent {
  studentId: string;
  name: string;
  dob?: string;
  address?: string;
  residence?: string;
  phone?: string;
  grade?: string;
  classLetter?: string;
  schoolYear?: string;
  major?: string; // ngành
  classCode?: string; // mã lớp (vd: 1ACNTT)
  createdAt?: string;
}

// Kiểu response khi tạo học sinh
interface ICreateStudentResp {
  student?: ICreatedStudent;
  studentId?: string;
}

// Kiểu lớp (danh sách lớp)
interface IClass {
  classId: string;
  grade: string;
  classLetter: string;
  major?: string;
  classCode?: string;
  teacherName?: string;
  studentIds?: string[];
}

export default function AdminProfile(): JSX.Element {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("news");
  const [pendingNews, setPendingNews] = useState<INews[]>([]);
  const [locked, setLocked] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Form tạo học sinh
  const [studentForm, setStudentForm] = useState({
    name: "",
    dob: "",
    address: "",
    residence: "",
    phone: "",
    grade: "",
    classLetter: "",
    schoolYear: "",
    major: "", // thêm ngành
  });
  const [creating, setCreating] = useState<boolean>(false);

  // Danh sách học sinh (lịch sử tạo)
  const [createdStudents, setCreatedStudents] = useState<ICreatedStudent[]>([]);
  // Danh sách lớp
  const [classes, setClasses] = useState<IClass[]>([]);

  // Modal xem chi tiết
  const [viewing, setViewing] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] =
    useState<ICreatedStudent | null>(null);
  // loading actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const authHeaders = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined;

  // ===== Helper: tạo viết tắt ngành (VD: "Công nghệ thông tin" -> "CNTT") =====
  function majorAbbrev(major?: string) {
    if (!major) return "";
    return major
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() : ""))
      .join("");
  }

  // ===== Fetch tin tức =====
  const fetchNews = async () => {
    try {
      const res = await axiosInstance.get<INews[]>(
        "/api/admin/news/pending",
        authHeaders
      );
      setPendingNews(res.data || []);
      setErrorMsg("");
    } catch (err: any) {
      console.warn("⚠️ fetchNews error:", err);
      setPendingNews([]);
      setErrorMsg(
        err?.response?.data?.message || "Không thể lấy tin tức chờ duyệt"
      );
    }
  };

  // ===== Fetch trạng thái khóa điểm =====
  const fetchLockStatus = async () => {
    try {
      const res = await axiosInstance.get<ILockResp>(
        "/api/admin/grades/status",
        authHeaders
      );
      setLocked(!!res.data.locked);
      setErrorMsg("");
    } catch (err: any) {
      console.warn("⚠️ fetchLockStatus error:", err);
      setErrorMsg(
        err?.response?.data?.message || "Không thể lấy trạng thái khóa điểm"
      );
    }
  };

  const toggleLock = async () => {
    try {
      if (!token) {
        alert("Bạn chưa đăng nhập!");
        return;
      }
      if (locked) {
        await axiosInstance.post("/api/admin/grades/unlock", {}, authHeaders);
        setLocked(false);
      } else {
        await axiosInstance.post("/api/admin/grades/lock", {}, authHeaders);
        setLocked(true);
      }
    } catch (err: any) {
      console.warn("⚠️ toggleLock error:", err);
      alert(
        err?.response?.data?.message ||
          "Không thể thay đổi trạng thái khóa điểm!"
      );
    }
  };

  // ===== Xử lý form =====
  const handleStudentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setStudentForm((s) => ({ ...s, [name]: value }));
  };

  // Mã học sinh = khóa + lớp + random(5)
  const generateStudentId = (grade?: string, cls?: string) => {
    const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
    const g = grade || studentForm.grade || "X";
    const c = cls || studentForm.classLetter || "X";
    return `${g}${c}${randomPart}`;
  };

  // Mã lớp = khóa + lớp + viết tắt ngành (VD: 1ACNTT)
  const generateClassCode = (grade?: string, cls?: string, major?: string) => {
    const g = grade || studentForm.grade || "X";
    const c = cls || studentForm.classLetter || "X";
    const abbr = majorAbbrev(major || studentForm.major || "");
    return `${g}${c}${abbr}`;
  };

  // ===== Fetch danh sách học sinh đã tạo =====
  const fetchCreatedStudents = async () => {
    try {
      if (!token) return;
      const res = await axiosInstance.get<ICreatedStudent[]>(
        "/api/admin/students",
        authHeaders
      );
      const data = Array.isArray(res.data) ? res.data : [];
      const normalized = data
        .map((d) => ({
          ...d,
          createdAt: d.createdAt
            ? new Date(d.createdAt).toISOString()
            : undefined,
        }))
        .sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      setCreatedStudents(normalized);
    } catch (err: any) {
      console.warn("⚠️ fetchCreatedStudents error:", err?.response || err);
      setCreatedStudents([]); // đảm bảo UI clear nếu lỗi
    }
  };

  // ===== Fetch danh sách lớp =====
  const fetchClasses = async () => {
    try {
      if (!token) return;
      const res = await axiosInstance.get<IClass[]>(
        "/api/admin/classes",
        authHeaders
      );
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.warn("⚠️ fetchClasses error:", err?.response || err);
    }
  };

  // ===== Tạo lớp (upsert) =====
  const createOrEnsureClass = async (
    gradeVal: string,
    classLetterVal: string,
    majorVal: string
  ) => {
    if (!token) return;
    const classCode = generateClassCode(gradeVal, classLetterVal, majorVal);
    try {
      await axiosInstance.post(
        "/api/admin/classes/create",
        {
          grade: gradeVal,
          classLetter: classLetterVal,
          major: majorVal,
          classCode,
        },
        authHeaders
      );
      await fetchClasses();
    } catch (err: any) {
      console.warn("⚠️ createOrEnsureClass error:", err?.response || err);
    }
  };

  // ===== Tạo học sinh =====
  const createStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert("Bạn chưa đăng nhập!");
      return;
    }
    if (user?.role !== "admin") {
      alert("Bạn không có quyền tạo học sinh!");
      return;
    }
    if (
      !studentForm.name ||
      !studentForm.dob ||
      !studentForm.grade ||
      !studentForm.classLetter
    ) {
      alert("Vui lòng điền đầy đủ: Họ tên, Ngày sinh, Khối, Lớp.");
      return;
    }

    setCreating(true);
    try {
      const studentId = generateStudentId(
        studentForm.grade,
        studentForm.classLetter
      );
      const classCode = generateClassCode(
        studentForm.grade,
        studentForm.classLetter,
        studentForm.major
      );
      const payload = { ...studentForm, studentId, classCode };

      const res = await axiosInstance.post<ICreateStudentResp>(
        "/api/admin/students/create",
        payload,
        authHeaders
      );

      await createOrEnsureClass(
        studentForm.grade,
        studentForm.classLetter,
        studentForm.major
      );

      // đảm bảo luôn đồng bộ với MongoDB
      await fetchCreatedStudents();

      alert(`✅ Tạo học sinh thành công! Mã học sinh: ${studentId}`);
      setStudentForm({
        name: "",
        dob: "",
        address: "",
        residence: "",
        phone: "",
        grade: "",
        classLetter: "",
        schoolYear: "",
        major: "",
      });
    } catch (err: any) {
      console.error("⚠️ createStudent error:", err?.response || err);
      alert(
        err?.response?.data?.message ||
          "Không thể tạo học sinh! Vui lòng thử lại."
      );
    } finally {
      setCreating(false);
    }
  };

  // ===== Xóa học sinh =====
  const deleteStudent = async (studentId: string) => {
    if (!token) {
      alert("Bạn chưa đăng nhập!");
      return;
    }
    if (!confirm(`Xác nhận xóa học sinh ${studentId}?`)) return;
    setActionLoading(studentId);
    try {
      await axiosInstance.delete(
        `/api/admin/students/${encodeURIComponent(studentId)}`,
        authHeaders
      );
      await fetchCreatedStudents();
      if (selectedStudent?.studentId === studentId) {
        setSelectedStudent(null);
        setViewing(false);
      }
      alert("✅ Xóa học sinh thành công.");
    } catch (err: any) {
      console.error("⚠️ deleteStudent error:", err?.response || err);
      alert(err?.response?.data?.message || "Xóa học sinh thất bại.");
    } finally {
      setActionLoading(null);
    }
  };

  // ===== Gán giáo viên =====
  const assignTeacher = async (studentId: string) => {
    if (!token) {
      alert("Bạn chưa đăng nhập!");
      return;
    }
    const teacherId = prompt(
      "Nhập teacherId (mã giáo viên) để gán cho học sinh:"
    );
    if (!teacherId) return;
    setActionLoading(studentId);
    try {
      await axiosInstance.post(
        `/api/admin/students/${encodeURIComponent(studentId)}/assign-teacher`,
        { teacherId },
        authHeaders
      );
      await fetchCreatedStudents();
      alert("✅ Gán giáo viên thành công.");
    } catch (err: any) {
      console.error("⚠️ assignTeacher error:", err?.response || err);
      alert(err?.response?.data?.message || "Gán giáo viên thất bại.");
    } finally {
      setActionLoading(null);
    }
  };

  const openView = (s: ICreatedStudent) => {
    setSelectedStudent(s);
    setViewing(true);
  };
  const closeView = () => {
    setSelectedStudent(null);
    setViewing(false);
  };

  useEffect(() => {
    fetchNews();
    fetchLockStatus();
    fetchCreatedStudents();
    fetchClasses();
    const iv = setInterval(() => fetchLockStatus().catch(() => {}), 30000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="profile">
      <aside className="profile__sidebar">
        <div className="profile__user text__content--size-18">
          <h3>Admin Panel</h3>
          <p>Quản trị viên</p>
        </div>
        <ul className="profile__menu">
          <li
            onClick={() => setActiveTab("news")}
            className={activeTab === "news" ? "active" : ""}
          >
            <FileText size={18} /> Tin tức chờ duyệt
          </li>
          <li
            onClick={() => setActiveTab("lock")}
            className={activeTab === "lock" ? "active" : ""}
          >
            {locked ? <Lock size={18} /> : <Unlock size={18} />} Trạng thái khóa
            điểm
          </li>
          <li
            onClick={() => setActiveTab("students")}
            className={activeTab === "students" ? "active" : ""}
          >
            <UserPlus size={18} /> Tạo học sinh
          </li>
          <li
            onClick={() => setActiveTab("classes")}
            className={activeTab === "classes" ? "active" : ""}
          >
            <Users size={18} /> Danh sách lớp
          </li>
        </ul>
      </aside>

      <main className="profile__content">
        {errorMsg && <p style={{ color: "red" }}>❌ {errorMsg}</p>}

        {activeTab === "news" && (
          <div className="profile__card">
            <h2>Tin tức chờ duyệt</h2>
            {pendingNews.length > 0 ? (
              <table className="profile__table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Tác giả</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingNews.map((news) =>
                    news.id ? (
                      <tr key={news.id}>
                        <td>{news.title}</td>
                        <td>{news.author || "N/A"}</td>
                        <td>
                          {news.createdAt
                            ? new Date(news.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ) : null
                  )}
                </tbody>
              </table>
            ) : (
              <p>Không có tin tức nào chờ duyệt.</p>
            )}
          </div>
        )}

        {activeTab === "lock" && (
          <div className="profile__card">
            <h2>Trạng thái khóa điểm</h2>
            <p>
              Hiện tại:{" "}
              <strong style={{ color: locked ? "red" : "green" }}>
                {locked ? "🔒 Đang khóa điểm" : "🔓 Chưa khóa điểm"}
              </strong>
            </p>
            <button
              onClick={toggleLock}
              style={{
                padding: "8px 16px",
                background: locked ? "orange" : "blue",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {locked ? "Mở khóa điểm" : "Khóa điểm"}
            </button>
          </div>
        )}

        {activeTab === "students" && (
          <div className="profile__card">
            <h2>Tạo thông tin học sinh</h2>

            <form
              onSubmit={createStudent}
              className="profile__form"
              style={{ marginBottom: 18 }}
            >
              <input
                name="name"
                placeholder="Họ tên học sinh"
                value={studentForm.name}
                onChange={handleStudentChange}
                required
              />
              <input
                type="date"
                name="dob"
                value={studentForm.dob}
                onChange={handleStudentChange}
                required
              />
              <input
                name="address"
                placeholder="Địa chỉ"
                value={studentForm.address}
                onChange={handleStudentChange}
                required
              />
              <input
                name="residence"
                placeholder="Nơi ở"
                value={studentForm.residence}
                onChange={handleStudentChange}
              />
              <input
                name="phone"
                placeholder="Số điện thoại"
                value={studentForm.phone}
                onChange={handleStudentChange}
              />
              <input
                name="grade"
                placeholder="Khóa (vd: 1,2,3)"
                value={studentForm.grade}
                onChange={handleStudentChange}
                required
              />
              <input
                name="classLetter"
                placeholder="Lớp (vd: A,B,C)"
                value={studentForm.classLetter}
                onChange={handleStudentChange}
                required
              />
              <input
                name="major"
                placeholder="Ngành (vd: Công nghệ thông tin)"
                value={studentForm.major}
                onChange={handleStudentChange}
              />
              <input
                name="schoolYear"
                placeholder="Niên khóa (vd: 2024-2025)"
                value={studentForm.schoolYear}
                onChange={handleStudentChange}
              />
              <button type="submit" disabled={creating}>
                {creating ? "Đang tạo..." : "Tạo học sinh"}
              </button>
            </form>

            {/* Lịch sử / danh sách học sinh đã tạo */}
            <h3>Lịch sử tạo học sinh</h3>
            {createdStudents.length > 0 ? (
              <table className="profile__table">
                <thead>
                  <tr>
                    <th>Mã HS</th>
                    <th>Họ tên</th>
                    <th>Khối</th>
                    <th>Lớp</th>
                    <th>Ngành</th>
                    <th>ClassCode</th>
                    <th>Niên khóa</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {createdStudents.map((stu) => (
                    <tr key={stu.studentId}>
                      <td>{stu.studentId}</td>
                      <td>{stu.name}</td>
                      <td>{stu.grade}</td>
                      <td>{stu.classLetter}</td>
                      <td>{stu.major || "N/A"}</td>
                      <td>
                        {stu.classCode ||
                          generateClassCode(
                            stu.grade,
                            stu.classLetter,
                            stu.major
                          )}
                      </td>
                      <td>{stu.schoolYear}</td>
                      <td>
                        {stu.createdAt
                          ? new Date(stu.createdAt).toLocaleString()
                          : "N/A"}
                      </td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <button title="Xem" onClick={() => openView(stu)}>
                          <Eye size={16} />
                        </button>
                        <button
                          title="Gán giáo viên"
                          onClick={() => assignTeacher(stu.studentId)}
                          disabled={actionLoading === stu.studentId}
                        >
                          <UserPlus2 size={16} />
                        </button>
                        <button
                          title="Xóa"
                          onClick={() => deleteStudent(stu.studentId)}
                          disabled={actionLoading === stu.studentId}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Chưa có học sinh nào được tạo.</p>
            )}
          </div>
        )}

        {activeTab === "classes" && (
          <div className="profile__card">
            <h2>Danh sách lớp</h2>
            {classes.length > 0 ? (
              <table className="profile__table">
                <thead>
                  <tr>
                    <th>Khóa</th>
                    <th>Lớp</th>
                    <th>Ngành</th>
                    <th>ClassCode</th>
                    <th>Giáo viên</th>
                    <th>Số học sinh</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.classId}>
                      <td>{cls.grade}</td>
                      <td>{cls.classLetter}</td>
                      <td>{cls.major || "N/A"}</td>
                      <td>
                        {cls.classCode ||
                          generateClassCode(
                            cls.grade,
                            cls.classLetter,
                            cls.major
                          )}
                      </td>
                      <td>{cls.teacherName || "N/A"}</td>
                      <td>{cls.studentIds?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Chưa có lớp nào.</p>
            )}
          </div>
        )}
      </main>

      {/* Simple modal for viewing student details */}
      {viewing && selectedStudent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            zIndex: 1000,
          }}
          onClick={closeView}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              minWidth: 320,
              maxWidth: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Chi tiết học sinh</h3>
            <table style={{ width: "100%", marginBottom: 12 }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700 }}>Mã HS</td>
                  <td>{selectedStudent.studentId}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Họ tên</td>
                  <td>{selectedStudent.name}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Ngày sinh</td>
                  <td>
                    {selectedStudent.dob
                      ? new Date(selectedStudent.dob).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Khối</td>
                  <td>{selectedStudent.grade}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Lớp</td>
                  <td>{selectedStudent.classLetter}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Ngành</td>
                  <td>{selectedStudent.major || "N/A"}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>ClassCode</td>
                  <td>
                    {selectedStudent.classCode ||
                      generateClassCode(
                        selectedStudent.grade,
                        selectedStudent.classLetter,
                        selectedStudent.major
                      )}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Niên khóa</td>
                  <td>{selectedStudent.schoolYear}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>SĐT</td>
                  <td>{selectedStudent.phone || "N/A"}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Nơi ở</td>
                  <td>{selectedStudent.residence || "N/A"}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Địa chỉ</td>
                  <td>{selectedStudent.address || "N/A"}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Ngày tạo</td>
                  <td>
                    {selectedStudent.createdAt
                      ? new Date(selectedStudent.createdAt).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => {
                  if (selectedStudent) assignTeacher(selectedStudent.studentId);
                }}
              >
                <UserPlus2 size={14} /> Gán giáo viên
              </button>
              <button
                onClick={() => {
                  if (selectedStudent) deleteStudent(selectedStudent.studentId);
                }}
              >
                <Trash2 size={14} /> Xóa
              </button>
              <button onClick={closeView}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
