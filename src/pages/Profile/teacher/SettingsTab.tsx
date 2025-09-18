// src/pages/Profile/TeacherProfile/SettingsTab.tsx
import React from "react";

interface Props {
  gradesLocked: boolean | null;
  loadingLock: boolean;
  fetchLockStatus: () => void;
}

export default function SettingsTab({
  gradesLocked,
  loadingLock,
  fetchLockStatus,
}: Props) {
  return (
    <section>
      <h3>Cài đặt & trạng thái</h3>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14 }}>Trạng thái khóa điểm:</div>
          <div
            style={{
              marginTop: 6,
              fontWeight: 700,
              color: gradesLocked ? "#c00" : "#0a7",
            }}
          >
            {loadingLock
              ? "Đang kiểm tra..."
              : gradesLocked === null
              ? "Không rõ"
              : gradesLocked
              ? "KHÓA"
              : "MỞ"}
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={fetchLockStatus}
            style={{ padding: "8px 12px", borderRadius: 6 }}
          >
            Làm mới
          </button>
        </div>
      </div>
      <div style={{ marginTop: 12, color: "#666" }}>
        Lưu ý: trạng thái khóa do admin/quản trị viên điều khiển. Nếu điểm bị
        khóa, giáo viên không thể gửi yêu cầu cập nhật hoặc chỉnh sửa trực tiếp.
      </div>
    </section>
  );
}
