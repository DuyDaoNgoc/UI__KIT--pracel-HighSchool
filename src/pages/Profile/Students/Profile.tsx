import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { User, Book, Calendar, CreditCard, GraduationCap } from "lucide-react";
import avatars from "../../../../public/assets/imgs/avatar/avatar.jpg";
import {
  IUserProfile,
  IGrade,
  ICredit,
  IScheduleItem,
  ITuition,
} from "../../../types/profiles";
import {
  fetchGrades,
  fetchCredits,
  fetchSchedule,
  fetchTuition,
} from "../../../Components/settings/hook/profiles/profileData";

// ✅ Cho phép truyền overrideUser
// thường dùng để sinh viên xem profile của mình
export default function Profile({
  // nếu có truyền overrideUser thì dùng, không thì lấy user từ auth
  overrideUser,
}: {
  // cho phép truyền user để xem profile người khác
  overrideUser?: IUserProfile;
}) {
  // lấy user từ auth
  const { user: authUser } = useAuth() as { user: IUserProfile | null };
  // tab đang active
  const [activeTab, setActiveTab] = useState("info");
  // user để hiển thị (có thể là overrideUser hoặc authUser)
  const [user, setUser] = useState<IUserProfile | null>(
    // overrideUser nếu có, nếu không thì lấy authUser
    overrideUser || authUser
  );
  // các dữ liệu khác
  // tạo state để lưu dữ liệu lấy về
  // điểm số
  const [grades, setGrades] = useState<IGrade[]>([]);
  // tín chỉ
  const [credits, setCredits] = useState<ICredit | null>(null);
  // thời khóa biểu
  const [schedule, setSchedule] = useState<IScheduleItem[]>([]);
  // học phí
  const [tuition, setTuition] = useState<ITuition | null>(null);
  // lỗi
  const [error, setError] = useState<string | null>(null);

  // Đồng bộ user khi overrideUser hoặc authUser thay đổi
  useEffect(
    () => {
      // nếu có overrideUser thì dùng, không thì dùng authUser
      if (overrideUser) {
        // set user thành overrideUser nếu có truyền vào (để xem profile người khác)
        setUser(overrideUser);
      } else {
        // nếu không có overrideUser thì dùng user từ auth
        setUser(authUser);
      }
    },
    // chỉ chạy lại khi overrideUser hoặc authUser thay đổi
    [overrideUser, authUser]
  );
  // lấy dữ liệu khi activeTab hoặc user thay đổi
  useEffect(() => {
    // nếu chưa có user thì không làm gì
    if (!user?._id) return;
    // hàm fetch dữ liệu dựa trên tab đang active
    const fetchData = async () => {
      // reset lỗi
      setError(null);
      try {
        // tùy tab mà fetch dữ liệu tương ứng
        switch (activeTab) {
          // default là tab info nên không fetch gì
          // chỉ fetch khi chuyển sang các tab khác
          // mỗi case là một tab
          // fetch điểm số
          case "grades":
            // gọi hàm fetchGrades từ profileData.ts
            // và truyền user._id vào
            // rồi setGrades với dữ liệu lấy về
            setGrades(await fetchGrades(user._id));
            break;
          // fetch tín chỉ
          case "credits":
            setCredits(await fetchCredits(user._id));
            break;
          // fetch thời khóa biểu
          case "schedule":
            setSchedule(await fetchSchedule(user._id));
            break;
          // fetch học phí
          case "tuition":
            setTuition(await fetchTuition(user._id));
            break;
          default:
            break;
        }
        // nếu có lỗi trong quá trình fetch thì catch và set lỗi
        // ví dụ lỗi mạng, lỗi server, v.v.
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Unknown error");
      }
    };
    // gọi hàm fetchData để lấy dữ liệu
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
