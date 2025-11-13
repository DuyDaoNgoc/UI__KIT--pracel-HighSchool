import { toast, Toaster } from "react-hot-toast";
import React from "react";

interface Props {
  locked: boolean;
  toggleLock: () => Promise<boolean>;
}

export default function LockTab({ locked, toggleLock }: Props) {
  const handleClick = async () => {
    try {
      const newLocked = await toggleLock();
      toast.success(newLocked ? "🔒 Đã khóa điểm!" : "🔓 Đã mở khóa điểm!");
    } catch {
      toast.error("Không thể thay đổi trạng thái khóa điểm!");
    }
  };

  return (
    <div className="profile__card">
      <h2>Trạng thái khóa điểm</h2>
      <p>
        Hiện tại:{" "}
        <strong className={locked ? "locked" : "unlocked"}>
          {locked ? "🔒 Đang khóa điểm" : "🔓 Chưa khóa điểm"}
        </strong>
      </p>
      <button
        className={locked ? "btn-locked" : "btn-unlocked"}
        onClick={handleClick} // ✅ fix lặp & lỗi void
      >
        {locked ? "Mở khóa điểm" : "Khóa điểm"}
      </button>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
