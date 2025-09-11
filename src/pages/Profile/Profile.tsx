import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Book, Calendar, CreditCard, GraduationCap } from "lucide-react";
import avatars from "../../../public/assets/imgs/avatar/avatar.jpg";
import {
  IUserProfile,
  IGrade,
  ICredit,
  IScheduleItem,
  ITuition,
} from "../../types/profiles";
import {
  fetchGrades,
  fetchCredits,
  fetchSchedule,
  fetchTuition,
} from "../../Components/settings/hook/profiles/profileData";

// ✅ Cho phép truyền overrideUser
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
  const [grades, setGrades] = useState<IGrade[]>([]);
  const [credits, setCredits] = useState<ICredit | null>(null);
  const [schedule, setSchedule] = useState<IScheduleItem[]>([]);
  const [tuition, setTuition] = useState<ITuition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (overrideUser) {
      setUser(overrideUser);
    } else {
      setUser(authUser);
    }
  }, [overrideUser, authUser]);

  useEffect(() => {
    if (!user?._id) return;

    const fetchData = async () => {
      setError(null);
      try {
        switch (activeTab) {
          case "grades":
            setGrades(await fetchGrades(user._id));
            break;
          case "credits":
            setCredits(await fetchCredits(user._id));
            break;
          case "schedule":
            setSchedule(await fetchSchedule(user._id));
            break;
          case "tuition":
            setTuition(await fetchTuition(user._id));
            break;
          default:
            break;
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Unknown error");
      }
    };

    fetchData();
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

        {activeTab === "info" && (
          <div className="profile__card text__content--size-12">
            <h2>Thông tin cá nhân</h2>
            <p>
              <b>Email:</b> {user.email}
            </p>
            <p>
              <b>Lớp:</b> {user.class ?? "Chưa cập nhật"}
            </p>
            <p>
              <b>Năm học:</b> {user.schoolYear ?? "Chưa cập nhật"}
            </p>
            <p>
              <b>Số điện thoại:</b> {user.phone ?? "Chưa cập nhật"}
            </p>
            <p>
              <b>Địa chỉ:</b> {user.address ?? "Chưa cập nhật"}
            </p>
          </div>
        )}

        {activeTab === "grades" && (
          <div className="profile__card">
            <h2>Điểm số & Hạnh kiểm</h2>
            {grades.length === 0 ? (
              <p>Không có dữ liệu</p>
            ) : (
              grades.map((g) => (
                <p key={g.subject}>
                  <b>{g.subject}:</b> {g.score}
                </p>
              ))
            )}
          </div>
        )}

        {activeTab === "credits" && (
          <div className="profile__card">
            <h2>Tín chỉ</h2>
            {credits ? (
              <>
                <p>
                  <b>Tổng:</b> {credits.total}
                </p>
                <p>
                  <b>Đã tích lũy:</b> {credits.earned}
                </p>
              </>
            ) : (
              <p>Không có dữ liệu</p>
            )}
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="profile__card">
            <h2>Thời khóa biểu</h2>
            {schedule.length === 0 ? (
              <p>Không có dữ liệu</p>
            ) : (
              schedule.map((s, i) => (
                <p key={i}>
                  <b>{s.day}:</b> {s.subjects.join(" - ")}
                </p>
              ))
            )}
          </div>
        )}

        {activeTab === "tuition" && (
          <div className="profile__card">
            <h2>Học phí</h2>
            {tuition ? (
              <>
                <p>
                  <b>Tổng:</b> {tuition.total}
                </p>
                <p>
                  <b>Đã đóng:</b> {tuition.paid}
                </p>
                <p>
                  <b>Còn nợ:</b> {tuition.remaining}
                </p>
                {/* ✅ thêm bán trú & nội trú */}
                <p>
                  <b>Bán trú:</b> {tuition.daycare ?? "Không có dữ liệu"}
                </p>
                <p>
                  <b>Nội trú:</b> {tuition.boarding ?? "Không có dữ liệu"}
                </p>
              </>
            ) : (
              <p>Không có dữ liệu</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
