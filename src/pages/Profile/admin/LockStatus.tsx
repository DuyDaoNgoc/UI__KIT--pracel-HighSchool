// src/pages/Profile/admin/LockStatus.tsx
import React from "react";
import { Lock, Unlock } from "lucide-react";

interface Props {
  locked: boolean;
  toggleLock: () => void;
}

export default function LockStatus({ locked, toggleLock }: Props) {
  return (
    <div className="profile__card">
      <h2>Trạng thái khóa điểm</h2>
      <p>
        Hiện tại:{" "}
        <strong style={{ color: locked ? "red" : "green" }}>
          {locked ? "🔒 Đang khóa điểm" : "🔓 Chưa khóa điểm"}
        </strong>
      </p>
      <button
        onClick={toggleLock}
        style={{
          padding: "8px 16px",
          background: locked ? "orange" : "blue",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {locked ? "Mở khóa điểm" : "Khóa điểm"}
      </button>
    </div>
  );
}
