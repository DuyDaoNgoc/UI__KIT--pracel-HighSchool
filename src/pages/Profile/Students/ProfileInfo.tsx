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

interface ProfileInfoProps {
  user: IUserProfile;
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
  const classText =
    typeof user.classCode === "string"
      ? user.classCode
      : user.classCode
        ? `${user.classCode.className} (${user.classCode.grade})`
        : "-";

  const majorText =
    typeof user.major === "string"
      ? user.major
      : user.major
        ? `${user.major.name} (${user.major.code || ""})`
        : "-";

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return String(dateString);
    }
  };
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
            <p className="student-code">Mã HS: {user.studentId || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Info Grid - 3 columns of info cards */}
      <div className="info-grid">
        {/* Column 1 - Academic Info */}
        <div className="info-card">
          <div className="info-card-icon student-info-icon">
            <Code size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Mã học sinh</span>
            <span className="info-value">{user.studentId || "N/A"}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon class-info-icon">
            <BookOpen size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Lớp</span>
            <span className="info-value">{classText}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon major-info-icon">
            <Award size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Ngành</span>
            <span className="info-value">{majorText}</span>
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
            <span className="info-value">{user.schoolYear || "-"}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon birth-info-icon">
            <User size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Ngày sinh</span>
            <span className="info-value">{formatDate(user.dob)}</span>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-icon grade-info-icon">
            <Globe size={20} />
          </div>
          <div className="info-card-content">
            <span className="info-label">Khối</span>
            <span className="info-value">{user.grade || "-"}</span>
          </div>
        </div>
      </div>

      {/* Summary Stats Section */}
      {(user.gpa || user.credits) && (
        <div className="profile-stats">
          <h3 className="stats-title">Tổng quan học tập</h3>
          <div className="stats-grid">
            {user.gpa && (
              <div className="stat-item">
                <div className="stat-icon gpa-icon">
                  <Award size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{user.gpa}</span>
                  <span className="stat-label">Điểm TB</span>
                </div>
              </div>
            )}
            {user.credits && (
              <div className="stat-item">
                <div className="stat-icon credits-icon">
                  <BookOpen size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{user.credits}</span>
                  <span className="stat-label">Tín chỉ tích lũy</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
