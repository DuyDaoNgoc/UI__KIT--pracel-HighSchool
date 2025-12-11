import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { IUserProfile } from "../../../types/profiles";
import {
  User,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  FileText,
} from "lucide-react";
import avatars from "../../../../public/assets/imgs/avatar/avatar.jpg";
import TeacherInfo from "./InfoTab";
import TeacherClasses from "./TeacherClasses";
import TeacherSchedule from "./TeacherSchedule";
import TeacherGrades from "./TeacherGrades";
import TeacherStatistics from "./TeacherStatistics";
import TeacherSettings from "./TeacherSettings";
import ReportsTab from "./ReportsTab";
import useTeacherData from "../../../Components/settings/hook/profiles/useTeacherData";

export default function TeacherProfile() {
  const { user: authUser } = useAuth() as { user: IUserProfile | null };
  const [activeTab, setActiveTab] = useState("info");
  const [user, setUser] = useState<IUserProfile | null>(authUser);

  const { classes, schedule, grades, statistics, error, fetchAll } =
    useTeacherData();

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  useEffect(() => {
    if (user?.teacherId) fetchAll(activeTab, user.teacherId);
  }, [activeTab, user]);

  if (!user) return <div>Vui lòng đăng nhập để xem thông tin giáo viên.</div>;

  return (
    <div className="profile">
      {/* Sidebar */}
      <aside className="profile__sidebar">
        <div className="profile__user text__content--size-18">
          <img
            src={user.avatar || avatars}
            alt="avatar"
            className="profile--avatar"
            crossOrigin="anonymous"
            onError={(e) => (e.currentTarget.src = avatars)}
          />
          <h3>{user.username}</h3>
          <p>{user.role}</p>
        </div>
        <ul className="profile__menu">
          <li
            onClick={() => setActiveTab("info")}
            className={activeTab === "info" ? "active" : ""}
          >
            <User size={18} /> Thông tin cá nhân
          </li>
          <li
            onClick={() => setActiveTab("classes")}
            className={activeTab === "classes" ? "active" : ""}
          >
            <BookOpen size={18} /> Lớp dạy
          </li>
          <li
            onClick={() => setActiveTab("schedule")}
            className={activeTab === "schedule" ? "active" : ""}
          >
            <Calendar size={18} /> Thời khóa biểu
          </li>
          <li
            onClick={() => setActiveTab("grades")}
            className={activeTab === "grades" ? "active" : ""}
          >
            <BarChart3 size={18} /> Quản lý điểm
          </li>
          <li
            onClick={() => setActiveTab("statistics")}
            className={activeTab === "statistics" ? "active" : ""}
          >
            <BarChart3 size={18} /> Thống kê
          </li>
          <li
            onClick={() => setActiveTab("settings")}
            className={activeTab === "settings" ? "active" : ""}
          >
            <Settings size={18} /> Cài đặt
          </li>
          <li
            onClick={() => setActiveTab("reports")}
            className={activeTab === "reports" ? "active" : ""}
          >
            <FileText size={18} /> Báo cáo học sinh
          </li>
        </ul>
      </aside>

      {/* Main content */}
      <main className="profile__content">
        {error && <p style={{ color: "red" }}>❌ {error}</p>}

        {activeTab === "info" && <TeacherInfo user={user} />}
        {activeTab === "classes" && <TeacherClasses classes={classes} />}
        {activeTab === "schedule" && <TeacherSchedule schedule={schedule} />}
        {activeTab === "grades" && (
          <TeacherGrades teacherId={user.teacherId} classes={classes} />
        )}
        {activeTab === "statistics" && (
          <TeacherStatistics statistics={statistics} classes={classes} />
        )}
        {activeTab === "settings" && <TeacherSettings user={user} />}
        {activeTab === "reports" && (
          <ReportsTab classes={classes} teacherId={user.teacherId} />
        )}
      </main>
    </div>
  );
}
