// src/pages/Profile/admin/AdminProfile.tsx
import React, { useEffect, useState, FC } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { INews } from "../../../types/news";
import { ICreatedStudent } from "../../../types/student";
import Logout from "../../../Components/settings/logout/logout";
import NotFound from "../../../error/404NotFound";
import { useAuth } from "../../../context/AuthContext";

import AdminSidebar from "./AdminSidebar";
import NewsTab from "./News/NewsTab";
import LockTab from "./Lock/LockTab";
import StudentsTab from "./StudentsTab";
import ClassesTab from "./createrRole/ClassesTab";
import StudentModal from "./StudentModal";
import CreateTeacher from "./createrRole/CreateTeacher";
import UserManagement from "./UserManagement";
import AdminDashboard from "./Dashboard/AdminDashboard";
import CreateClass from "./Class/CreateClass";

// ======================== INTERFACES ========================
interface ILockResp {
  locked: boolean;
}

interface IStudentForm {
  name: string;
  dob: string;
  address: string;
  residence: string;
  phone: string;
  grade: string;
  classLetter: string;
  schoolYear: string;
  major: string;
}

// ======================== COMPONENT ========================
const AdminProfile: FC = () => {
  const { user, token } = useAuth();

  // ==== STATE ====
  const [activeTab, setActiveTab] = useState<string>("news");
  const [pendingNews, setPendingNews] = useState<INews[]>([]);
  const [locked, setLocked] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [studentForm, setStudentForm] = useState<IStudentForm>({
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
  const [viewing, setViewing] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] =
    useState<ICreatedStudent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const authHeaders = token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined;

  // ==== Helper: viết tắt ngành ====
  const majorAbbrev = (major?: string): string => {
    if (!major) return "";
    return major
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() : ""))
      .join("");
  };

  // ==== Fetch tin tức ====
  const fetchNews = async (): Promise<void> => {
    try {
      const res = await axiosInstance.get<INews[]>(
        "/admin/news/pending",
        authHeaders,
      );
      setPendingNews(Array.isArray(res.data) ? res.data : []);
      setErrorMsg("");
    } catch (err) {
      console.warn("⚠️ fetchNews error:", err);
      setPendingNews([]);
      setErrorMsg("Không thể lấy tin tức chờ duyệt");
    }
  };

  // ==== Fetch trạng thái khóa điểm ====
  const fetchLockStatus = async (): Promise<void> => {
    try {
      const res = await axiosInstance.get<ILockResp>(
        "/admin/grades/status",
        authHeaders,
      );
      setLocked(!!res.data?.locked);
    } catch (err) {
      console.warn("⚠️ fetchLockStatus error:", err);
    }
  };

  // ==== Toggle khóa/mở khóa ====
  const toggleLock = async (): Promise<void> => {
    try {
      if (locked) {
        await axiosInstance.post("/admin/grades/unlock", {}, authHeaders);
        setLocked(false);
      } else {
        await axiosInstance.post("/admin/grades/lock", {}, authHeaders);
        setLocked(true);
      }
    } catch (err) {
      console.warn("⚠️ toggleLock error:", err);
      alert("Không thể thay đổi trạng thái khóa điểm!");
    }
  };

  // ==== Handle form input ====
  const handleStudentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = e.target;
    setStudentForm((prev) => ({ ...prev, [name]: value }));
  };

  // ==== Generate ID / ClassCode ====
  const generateStudentId = (grade?: string, cls?: string): string => {
    const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
    const g = grade || studentForm.grade || "X";
    const c = cls || studentForm.classLetter || "X";
    return `${g}${c}${randomPart}`;
  };

  const generateClassCode = (
    grade?: string,
    cls?: string,
    major?: string,
  ): string => {
    const g = grade || studentForm.grade || "X";
    const c = cls || studentForm.classLetter || "X";
    const abbr = majorAbbrev(major || studentForm.major || "");
    return `${g}${c}${abbr}`;
  };

  // ==== Fetch students ====
  const fetchCreatedStudents = async (): Promise<void> => {
    try {
      const res = await axiosInstance.get<ICreatedStudent[]>(
        "/admin/students",
        authHeaders,
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setCreatedStudents(
        data.sort((a, b) => {
          const aTime = new Date(a?.createdAt ?? 0).getTime();
          const bTime = new Date(b?.createdAt ?? 0).getTime();
          return bTime - aTime;
        }),
      );
    } catch (err) {
      console.warn("⚠️ fetchCreatedStudents error:", err);
      setCreatedStudents([]);
    }
  };

  // ==== Create student ====
  const createStudent = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const { name, dob, grade, classLetter, major } = studentForm;

    if (!name || !dob || !grade || !classLetter) {
      alert("Vui lòng nhập đủ: Họ tên, Ngày sinh, Khối, Lớp.");
      return;
    }

    setCreating(true);
    try {
      const studentId = generateStudentId(grade, classLetter);
      const classCode = generateClassCode(grade, classLetter, major);
      const payload = { ...studentForm, studentId, classCode };

      await axiosInstance.post<ICreatedStudent>(
        "/admin/students/create",
        payload,
        authHeaders,
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
  const deleteStudent = async (studentId: string): Promise<void> => {
    if (!studentId || !confirm(`Xác nhận xóa học sinh ${studentId}?`)) return;

    setActionLoading(studentId);
    try {
      await axiosInstance.delete(`/admin/students/${studentId}`, authHeaders);
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
  const assignTeacher = async (studentId: string): Promise<void> => {
    const teacherId = prompt("Nhập teacherId:");
    if (!teacherId) return;

    setActionLoading(studentId);
    try {
      await axiosInstance.post(
        `/admin/students/${studentId}/assign-teacher`,
        { teacherId },
        authHeaders,
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
  const openView = (s: ICreatedStudent): void => {
    if (!s) return;
    setSelectedStudent(s);
    setViewing(true);
  };

  const closeView = (): void => {
    setSelectedStudent(null);
    setViewing(false);
  };

  // ==== useEffect init ====
  useEffect(() => {
    fetchNews();
    fetchLockStatus();
    fetchCreatedStudents();
    const iv = setInterval(fetchLockStatus, 30000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==== Render ====
  if (!token || user?.role !== "admin") {
    return <NotFound />;
  }

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
        {activeTab === "create-class" && <CreateClass />}
        {activeTab === "create-teacher" && <CreateTeacher />}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "dashboard" && <AdminDashboard />}
      </main>

      {viewing && selectedStudent && (
        <StudentModal
          viewing={viewing}
          selectedStudent={selectedStudent}
          closeView={closeView}
          assignTeacher={assignTeacher}
          deleteStudent={deleteStudent}
          generateClassCode={generateClassCode}
        />
      )}
    </div>
  );
};

export default AdminProfile;
