// src/pages/Profile/admin/AdminProfile.tsx
import React, { useEffect, useState, FC } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { INews } from "../../../types/news";
import { ICreatedStudent } from "../../../types/student";

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

import AdminSidebar from "./AdminSidebar";
import NewsTab from "./NewsTab";
import LockTab from "./LockTab";
import StudentsTab from "./StudentsTab";
import ClassesTab from "./ClassesTab";
import StudentModal from "./StudentModal";
import CreateTeacher from "./CreateTeacher";
interface ILockResp {
  locked: boolean;
}

const AdminProfile: FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("news");

  // State quản lý
  const [pendingNews, setPendingNews] = useState<INews[]>([]);
  const [locked, setLocked] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [studentForm, setStudentForm] = useState({
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
  const [creating, setCreating] = useState<boolean>(false);
  const [createdStudents, setCreatedStudents] = useState<ICreatedStudent[]>([]);

  // Modal
  const [viewing, setViewing] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] =
    useState<ICreatedStudent | null>(null);

  // Loading cho các action (xóa / gán teacher)
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const authHeaders = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined;

  // ==== Helper: viết tắt ngành ====
  const majorAbbrev = (major?: string) => {
    if (!major) return "";
    return major
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() : ""))
      .join("");
  };

  // ==== Fetch tin tức ====
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

  // ==== Fetch trạng thái khóa điểm ====
  const fetchLockStatus = async () => {
    try {
      const res = await axiosInstance.get<ILockResp>(
        "/api/admin/grades/status",
        authHeaders
      );
      setLocked(!!res.data.locked);
    } catch (err: any) {
      console.warn("⚠️ fetchLockStatus error:", err);
    }
  };

  // ==== Toggle khóa/mở khóa ====
  const toggleLock = async () => {
    try {
      if (!token) return alert("Bạn chưa đăng nhập!");
      if (locked) {
        await axiosInstance.post("/api/admin/grades/unlock", {}, authHeaders);
        setLocked(false);
      } else {
        await axiosInstance.post("/api/admin/grades/lock", {}, authHeaders);
        setLocked(true);
      }
    } catch (err: any) {
      console.warn("⚠️ toggleLock error:", err);
      alert("Không thể thay đổi trạng thái khóa điểm!");
    }
  };

  // ==== Handle form input ====
  const handleStudentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setStudentForm((s) => ({ ...s, [name]: value }));
  };

  // ==== Generate ID / ClassCode ====
  const generateStudentId = (grade?: string, cls?: string) => {
    const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
    const g = grade || studentForm.grade || "X";
    const c = cls || studentForm.classLetter || "X";
    return `${g}${c}${randomPart}`;
  };

  const generateClassCode = (grade?: string, cls?: string, major?: string) => {
    const g = grade || studentForm.grade || "X";
    const c = cls || studentForm.classLetter || "X";
    const abbr = majorAbbrev(major || studentForm.major || "");
    return `${g}${c}${abbr}`;
  };

  // ==== Fetch students ====
  const fetchCreatedStudents = async () => {
    try {
      if (!token) return;
      const res = await axiosInstance.get<ICreatedStudent[]>(
        "/api/admin/students",
        authHeaders
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setCreatedStudents(
        data.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        })
      );
    } catch (err) {
      console.warn("⚠️ fetchCreatedStudents error:", err);
      setCreatedStudents([]);
    }
  };

  // ==== Create student ====
  const createStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert("Bạn chưa đăng nhập!");
    if (user?.role !== "admin") return alert("Bạn không có quyền!");

    if (
      !studentForm.name ||
      !studentForm.dob ||
      !studentForm.grade ||
      !studentForm.classLetter
    ) {
      return alert("Vui lòng nhập đủ: Họ tên, Ngày sinh, Khối, Lớp.");
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

      await axiosInstance.post<ICreatedStudent>(
        "/api/admin/students/create",
        payload,
        authHeaders
      );

      await fetchCreatedStudents();
      alert(`✅ Tạo học sinh thành công! Mã: ${studentId}`);

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
    } catch (err) {
      console.error("⚠️ createStudent error:", err);
      alert("Không thể tạo học sinh!");
    } finally {
      setCreating(false);
    }
  };

  // ==== Delete student ====
  const deleteStudent = async (studentId: string) => {
    if (!token) return alert("Bạn chưa đăng nhập!");
    if (!confirm(`Xác nhận xóa học sinh ${studentId}?`)) return;

    setActionLoading(studentId);
    try {
      await axiosInstance.delete(
        `/api/admin/students/${studentId}`,
        authHeaders
      );
      await fetchCreatedStudents();
      if (selectedStudent?.studentId === studentId) {
        setSelectedStudent(null);
        setViewing(false);
      }
      alert("✅ Đã xóa học sinh.");
    } catch (err) {
      console.error("⚠️ deleteStudent error:", err);
      alert("Xóa học sinh thất bại.");
    } finally {
      setActionLoading(null);
    }
  };

  // ==== Assign teacher ====
  const assignTeacher = async (studentId: string) => {
    if (!token) return alert("Bạn chưa đăng nhập!");
    const teacherId = prompt("Nhập teacherId:");
    if (!teacherId) return;

    setActionLoading(studentId);
    try {
      await axiosInstance.post(
        `/api/admin/students/${studentId}/assign-teacher`,
        { teacherId },
        authHeaders
      );
      await fetchCreatedStudents();
      alert("✅ Gán giáo viên thành công.");
    } catch (err) {
      console.error("⚠️ assignTeacher error:", err);
      alert("Gán giáo viên thất bại.");
    } finally {
      setActionLoading(null);
    }
  };

  // ==== Modal helpers ====
  const openView = (s: ICreatedStudent) => {
    setSelectedStudent(s);
    setViewing(true);
  };
  const closeView = () => {
    setSelectedStudent(null);
    setViewing(false);
  };

  // ==== useEffect init ====
  useEffect(() => {
    fetchNews();
    fetchLockStatus();
    fetchCreatedStudents();
    const iv = setInterval(() => fetchLockStatus(), 30000);
    return () => clearInterval(iv);
  }, [token]);

  // ==== Render ====
  return (
    <div className="profile">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        locked={locked}
      />

      <main className="profile__content">
        {errorMsg && <p className="error-msg">❌ {errorMsg}</p>}

        {activeTab === "news" && <NewsTab pendingNews={pendingNews} />}
        {activeTab === "lock" && (
          <LockTab locked={locked} toggleLock={toggleLock} />
        )}
        {activeTab === "students" && (
          <StudentsTab
            studentForm={studentForm}
            handleStudentChange={handleStudentChange}
            creating={creating}
            createStudent={createStudent}
            createdStudents={createdStudents}
            generateClassCode={generateClassCode}
            actionLoading={actionLoading}
            openView={openView}
            assignTeacher={assignTeacher}
            deleteStudent={deleteStudent}
          />
        )}
        {activeTab === "classes" && <ClassesTab students={createdStudents} />}

        {activeTab === "create-teacher" && <CreateTeacher />}
      </main>

      <StudentModal
        viewing={viewing}
        selectedStudent={selectedStudent}
        closeView={closeView}
        assignTeacher={assignTeacher}
        deleteStudent={deleteStudent}
        generateClassCode={generateClassCode}
      />
    </div>
  );
};

export default AdminProfile;
