import {
  FileText,
  Lock,
  Unlock,
  UserPlus,
  Users,
  BookOpen,
  BarChart2,
  LogIn,
  BookMarked,
  DollarSign,
  Calendar,
} from "lucide-react";
import Logout from "@/Components/settings/logout/logout";
import { useAuth } from "../../../context/AuthContext";
import { Link } from "react-router-dom";
import HomeIcon from "@/icons/HomeIcon";
import { motion } from "framer-motion";
import { pageVariants } from "../../../configs/animations/pageVariants";
import { useNavigate } from "react-router-dom";
import { Socket } from "socket.io-client";
import { toast, Toaster } from "react-hot-toast";

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
  const navigate = useNavigate();

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
      </div>
      <ul className="profile__menu">
        <li>
          <input type="text" name="" id="" />
        </li>
        <li
          onClick={() => setActiveTab("dashboard")}
          className={activeTab === "dashboard" ? "active" : ""}
        >
          <BarChart2 /> Thống kê
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
          {locked ? (
            <Lock size={18} className="locked" />
          ) : (
            <Unlock size={18} className="unlocked" />
          )}{" "}
          Trạng thái khóa điểm
        </li>
        <li
          onClick={() => setActiveTab("grade-lock")}
          className={activeTab === "grade-lock" ? "active" : ""}
        >
          <Lock size={18} /> Khóa điểm theo môn
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
          onClick={() => setActiveTab("schedule-teachers")}
          className={activeTab === "schedule-teachers" ? "active" : ""}
        >
          <BookOpen size={18} /> Xếp giáo viên vào lớp
        </li>

        <li
          onClick={() => setActiveTab("subjects")}
          className={activeTab === "subjects" ? "active" : ""}
        >
          <BookMarked size={18} /> Quản lý môn học
        </li>

        <li
          onClick={() => setActiveTab("tuitions")}
          className={activeTab === "tuitions" ? "active" : ""}
        >
          <DollarSign size={18} /> Bảng học phí
        </li>

        <li
          onClick={() => setActiveTab("grades")}
          className={activeTab === "grades" ? "active" : ""}
        >
          <BookOpen size={18} /> Quản lý điểm
        </li>

        <li
          onClick={() => setActiveTab("payments")}
          className={activeTab === "payments" ? "active" : ""}
        >
          <DollarSign size={18} /> Quản lý học phí
        </li>

        <li
          onClick={() => setActiveTab("timetables")}
          className={activeTab === "timetables" ? "active" : ""}
        >
          <Calendar size={18} /> Thời khóa biểu
        </li>

        <li
          onClick={() => setActiveTab("users")}
          className={activeTab === "users" ? "active" : ""}
        >
          <Users size={18} /> Quản lý người dùng
        </li>
      </ul>
      <ul className="profile__menu">
        <li className={activeTab === "logout" ? "active" : ""}>
          <Logout />
        </li>
      </ul>
    </motion.aside>
  );
}
