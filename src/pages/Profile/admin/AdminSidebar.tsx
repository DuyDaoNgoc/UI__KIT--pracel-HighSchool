// src/pages/Profile/admin/AdminSidebar.tsx
import { FileText, Lock, Unlock, UserPlus, Users } from "lucide-react";

interface Props {
  activeTab: string;
  locked: boolean;
  setActiveTab: (tab: string) => void;
}

export default function AdminSidebar({
  activeTab,
  locked,
  setActiveTab,
}: Props) {
  return (
    <aside className="profile__sidebar">
      <div className="profile__user">
        <h3 className="titlecolor">Admin Panel</h3>
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
        <li
          onClick={() => setActiveTab("create-teacher")}
          className={activeTab === "create-teacher" ? "active" : ""}
        >
          <UserPlus size={18} /> Tạo giáo viên
        </li>
      </ul>
    </aside>
  );
}
