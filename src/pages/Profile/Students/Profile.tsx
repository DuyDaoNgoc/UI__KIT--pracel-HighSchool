import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { User, Book, Calendar, CreditCard, GraduationCap } from "lucide-react";
import avatars from "../../../../public/assets/imgs/avatar/avatar.jpg";
import { IUserProfile } from "../../../types/profiles";

import ProfileInfo from "./ProfileInfo";
import ProfileGrades from "./ProfileGrades";
import ProfileCredits from "./ProfileCredits";
import ProfileSchedule from "./ProfileSchedule";
import ProfileTuition from "./ProfileTuition";
import useProfileData from "../../../Components/settings/hook/profiles/useProfileData";

export default function Profile({
  overrideUser,
}: {
  overrideUser?: IUserProfile;
}) {
  const { user: authUser } = useAuth() as { user: IUserProfile | null };
  const [activeTab, setActiveTab] = useState("info");
  const [user, setUser] = useState<IUserProfile | null>(
    overrideUser || authUser
  );

  const { grades, credits, schedule, tuition, error, fetchAll } =
    useProfileData();

  useEffect(() => {
    if (overrideUser) setUser(overrideUser);
    else setUser(authUser);
  }, [overrideUser, authUser]);

  useEffect(() => {
    if (user?._id) fetchAll(activeTab, user._id);
  }, [activeTab, user]);

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
            onClick={() => setActiveTab("credits")}
            className={activeTab === "credits" ? "active" : ""}
          >
            <GraduationCap size={18} /> Tín chỉ
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
        </ul>
      </aside>

      {/* Main content */}
      <main className="profile__content">
        {error && <p style={{ color: "red" }}>❌ {error}</p>}

        {activeTab === "info" && <ProfileInfo user={user} />}
        {activeTab === "grades" && <ProfileGrades grades={grades} />}
        {activeTab === "credits" && <ProfileCredits credits={credits} />}
        {activeTab === "schedule" && <ProfileSchedule schedule={schedule} />}
        {activeTab === "tuition" && <ProfileTuition tuition={tuition} />}
      </main>
    </div>
  );
}
