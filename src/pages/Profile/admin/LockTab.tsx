// src/pages/Profile/admin/LockTab.tsx
interface Props {
  locked: boolean;
  toggleLock: () => void;
}

export default function LockTab({ locked, toggleLock }: Props) {
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
        onClick={toggleLock}
      >
        {locked ? "Mở khóa điểm" : "Khóa điểm"}
      </button>
    </div>
  );
}
