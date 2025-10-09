import {
  FileText,
  Lock,
  Unlock,
  UserPlus,
  Users,
  BookOpen, // ✅ thêm icon cho lớp học
} from "lucide-react";
import Logout from "@/Components/settings/logout/logout";
import { useAuth } from "../../../context/AuthContext";
import { Link } from "react-router-dom";
import HomeIcon from "@/icons/HomeIcon";
import { motion } from "framer-motion";
import { pageVariants } from "../../../configs/animations/pageVariants";

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
  const { logout } = useAuth() as { logout: () => void };

  return (
    <motion.aside
      className="profile__sidebar"
      variants={pageVariants.zoom}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ willChange: "transform, opacity" }}
    >
      <div className="profile__user">
        <div className="home">
          <Link to="/">
            <HomeIcon />
          </Link>
          <h3 className="titlecolor">Admin Panel</h3>
        </div>
        <p>Quản trị viên</p>
      </div>

      <ul className="profile__menu">
        <li
          onClick={() => setActiveTab("dashboard")}
          className={activeTab === "dashboard" ? "active" : ""}
        >
          <HomeIcon /> Thống kê
        </li>

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
          onClick={() => setActiveTab("create-class")}
          className={activeTab === "create-class" ? "active" : ""}
        >
          <BookOpen size={18} /> Tạo lớp học {/* ✅ thêm icon */}
        </li>

        <li
          onClick={() => setActiveTab("create-teacher")}
          className={activeTab === "create-teacher" ? "active" : ""}
        >
          <UserPlus size={18} /> Tạo giáo viên
        </li>

        <li
          onClick={() => setActiveTab("users")}
          className={activeTab === "users" ? "active" : ""}
        >
          <Users size={18} /> Quản lý người dùng
        </li>
      </ul>

      <li>
        <Logout />
      </li>
    </motion.aside>
  );
}
