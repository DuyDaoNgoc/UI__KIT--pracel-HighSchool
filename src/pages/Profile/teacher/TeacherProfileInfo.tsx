import React from "react";
import { IUserProfile } from "../../../types/profiles";
import {
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Calendar,
  Award,
  Code,
  Building2,
  Globe,
} from "lucide-react";
import "../../../stylesheets/components/profile/_ProfileInfo.scss";

interface TeacherProfileInfoProps {
  user: IUserProfile;
}

export default function TeacherProfileInfo({ user }: TeacherProfileInfoProps) {
  const roleLabel = (r?: string) => {
    if (!r || r === "") return "-";
    if (r === "homeroom" || r === "chunhiem" || r === "chu-nhiem")
      return "Chủ nhiệm";
    if (r === "subjectHead" || r === "bomon") return "Bộ môn";
    if (r === "subjectTeacher" || r === "giaovienbomon")
      return "Giáo viên bộ môn";
    return r;
  };

  const isHomeroom = (r?: string) =>
    !r
      ? false
      : ["homeroom", "chunhiem", "chu-nhiem"].includes(r.toLowerCase());

  const homeroom = (user.assignedClass || []).find((c) => isHomeroom(c.role));
  const assignedClassesText = (() => {
    if (!homeroom) return "Không có lớp chủ nhiệm";
    const abbr = (homeroom.major || "")
      .split(/\s+/)
      .map((w) => (w[0] || "").toUpperCase())
      .join("")
      .slice(0, 10);
    const code = `${homeroom.grade}${homeroom.classLetter}${abbr}`;
    return `${code} — Chủ nhiệm`;
  })();

  const majorsText =
    user.majors && user.majors.length > 0 ? user.majors.join(", ") : "-";

  return (
    <div className="profile-info-container">
      {/* Header Section */}
      <div className="profile-header">
        <div className="header-content">
          <div className="header-icon">
            <User size={48} />
          </div>
          <div className="header-text">
            <h1 className="student-name">{user.username}</h1>
            <p className="student-code">Mã GV: {user.teacherId || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="info-grid">
        {/* Column 1 - Identifier & Role Info */}
        <div className="info-card">
          <div className="info-card-icon student-info-icon">
            <Code size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Mã giáo viên</span>
            <span className="info-value">{user.teacherId || "N/A"}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon class-info-icon">
            <Building2 size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Lớp chủ nhiệm</span>
            <span className="info-value">{assignedClassesText}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon major-info-icon">
            <Award size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Chuyên môn</span>
            <span className="info-value">{majorsText}</span>
          </div>
        </div>

        {/* Column 2 - Contact Info */}
        <div className="info-card">
          <div className="info-card-icon mail-info-icon">
            <Mail size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Email</span>
            <span className="info-value">{user.email || "-"}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon phone-info-icon">
            <Phone size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Số điện thoại</span>
            <span className="info-value">{user.phone || "-"}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon address-info-icon">
            <MapPin size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Địa chỉ</span>
            <span className="info-value">{user.address || "-"}</span>
          </div>
        </div>

        {/* Column 3 - Additional Info */}
        <div className="info-card">
          <div className="info-card-icon calendar-info-icon">
            <Calendar size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Niên khóa</span>
            <span className="info-value">{homeroom?.schoolYear || "-"}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon birth-info-icon">
            <BookOpen size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Chức Vụ</span>
            <span className="info-value">
              {homeroom ? roleLabel(homeroom.role) : "Không xác định"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
