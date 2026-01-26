import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  User,
  Book,
  Calendar,
  CreditCard,
  GraduationCap,
  BarChart3,
  Home,
} from "lucide-react";
import avatars from "../../../../public/assets/imgs/avatar/avatar.jpg";
import { IUserProfile } from "../../../types/profiles";
import axiosInstance from "../../../api/axiosConfig";
import ProfileInfo from "./ProfileInfo";
import ProfileGrades from "./ProfileGrades";
import ProfileSchedule from "./ProfileSchedule";
import ProfileTuition from "./ProfileTuition";
import ProfileStatistics from "./ProfileStatistics";
import useProfileData from "../../../Components/settings/hook/profiles/useProfileData";
import { useSocket } from "../../../Components/settings/hook/IOserver/useSocket";

export default function Profile({
  overrideUser,
}: {
  overrideUser?: IUserProfile;
}) {
  const { user: authUser } = useAuth() as { user: IUserProfile | null };
  const [activeTab, setActiveTab] = useState("info");
  const [user, setUser] = useState<IUserProfile | null>(
    overrideUser || authUser,
  );

  const { grades, credits, schedule, tuition, error, fetchAll } =
    useProfileData();

  useEffect(() => {
    if (overrideUser) setUser(overrideUser);
    else setUser(authUser);
  }, [overrideUser, authUser]);

  useEffect(() => {
    const idToUse = user?.studentId || user?._id;
    if (idToUse) fetchAll(activeTab, idToUse);
  }, [activeTab, user]);

  // Listen for realtime grade updates (socket + storage fallback)
  const { socket } = useSocket();

  useEffect(() => {
    if (!user) return;

    const handleSocket = (payload: any) => {
      try {
        if (!payload) return;
        const sid = payload.studentId;
        // If the update is for current student, refresh grades
        if (sid && user.studentId && sid === user.studentId) {
          fetchAll("grades", user._id);
        }
      } catch (e) {
        console.warn("handleSocket grade update error:", e);
      }
    };

    if (socket) socket.on("grade:updated", handleSocket);

    const handleStorage = (e: StorageEvent) => {
      try {
        if (e.key === "grade:updated" && e.newValue) {
          const data = JSON.parse(e.newValue as string);
          if (data?.studentId && data.studentId === user.studentId) {
            fetchAll("grades", user._id);
          }
        }
      } catch (err) {
        console.warn(err);
      }
    };

    window.addEventListener("storage", handleStorage as any);

    // also listen to custom event dispatched in same tab
    const handleCustom = (ev: any) => {
      try {
        const d = ev?.detail;
        if (d?.studentId && d.studentId === user.studentId) {
          fetchAll("grades", user._id);
        }
      } catch (err) {
        console.warn(err);
      }
    };
    window.addEventListener("grade:updated", handleCustom as any);

    // Listen for timetable updates and refresh schedule (will merge via useProfileData)
    const handleTimetableUpdate = () => {
      console.log("timetable:updated event received, refetching schedule...");
      fetchAll("schedule", user._id);
    };
    window.addEventListener("timetable:updated", handleTimetableUpdate as any);

    // also listen via socket so admin actions on other clients trigger updates
    const socketTimetableHandler = (payload: any) => {
      try {
        // If payload has classId, student profile may still need refresh (class-based)
        fetchAll("schedule", user._id);
      } catch (e) {
        console.warn("socket timetable handler error:", e);
      }
    };
    if (socket) socket.on("timetable:updated", socketTimetableHandler);

    return () => {
      if (socket) socket.off("grade:updated", handleSocket);
      if (socket) socket.off("timetable:updated", socketTimetableHandler);
      window.removeEventListener("storage", handleStorage as any);
      window.removeEventListener("grade:updated", handleCustom as any);
      window.removeEventListener(
        "timetable:updated",
        handleTimetableUpdate as any,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user]);

  if (!user) return <div>Vui lòng đăng nhập để xem thông tin cá nhân.</div>;

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
            onClick={() => setActiveTab("grades")}
            className={activeTab === "grades" ? "active" : ""}
          >
            <Book size={18} /> Điểm số & Hạnh kiểm
          </li>

          <li
            onClick={() => setActiveTab("schedule")}
            className={activeTab === "schedule" ? "active" : ""}
          >
            <Calendar size={18} /> Thời khóa biểu
          </li>
          <li
            onClick={() => setActiveTab("tuition")}
            className={activeTab === "tuition" ? "active" : ""}
          >
            <CreditCard size={18} /> Học phí
          </li>
          <li
            onClick={() => setActiveTab("statistics")}
            className={activeTab === "statistics" ? "active" : ""}
          >
            <BarChart3 size={18} /> Thống kê
          </li>
          <li>
            <Home size={18} />{" "}
            <a href="/" style={{ textDecoration: "none", color: "#4b4b4b" }}>
              Quay về trang chủ
            </a>
          </li>
        </ul>
      </aside>

      {/* Main content */}
      <main className="profile__content">
        {error && <p style={{ color: "red" }}>❌ {error}</p>}

        {activeTab === "info" && <ProfileInfo user={user} />}
        {activeTab === "grades" && <ProfileGrades grades={grades} />}

        {activeTab === "schedule" && <ProfileSchedule schedule={schedule} />}
        {activeTab === "tuition" && (
          <ProfileTuition tuition={tuition} studentId={user?._id} />
        )}
        {activeTab === "statistics" && (
          <ProfileStatistics
            grades={grades}
            tuition={tuition}
            studentId={user?._id}
            schoolYear={user?.schoolYear}
          />
        )}
      </main>
    </div>
  );
}
