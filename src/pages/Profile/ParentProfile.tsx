import React, { useState, useEffect } from "react";
import Profile from "./Profile";
import { IUserProfile } from "../../types/profiles";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosConfig";

export default function ParentProfile() {
  const { user: parent } = useAuth() as { user: IUserProfile | null };
  const [children, setChildren] = useState<IUserProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<IUserProfile | null>(
    null
  );

  useEffect(() => {
    if (!parent?.children?.length) return; // ✅ gọn và an toàn

    const fetchChildren = async () => {
      try {
        const { data } = await axiosInstance.get<IUserProfile[]>(
          `/api/users/children`,
          {
            params: { ids: parent.children!.join(",") }, // đã check ở trên nên dùng ! được
          }
        );
        setChildren(data);
      } catch (err) {
        console.error("Lỗi lấy danh sách học sinh:", err);
      }
    };

    fetchChildren();
  }, [parent]);

  if (!parent) return <p>Vui lòng đăng nhập.</p>;

  return (
    <div>
      <h2>Trang cá nhân phụ huynh</h2>
      <p>Xin chào {parent.username}</p>

      <h3>Danh sách học sinh</h3>
      {children.length === 0 ? (
        <p>Chưa liên kết học sinh nào.</p>
      ) : (
        children.map((child) => (
          <div key={child._id} style={{ marginBottom: 10 }}>
            <span>{child.username}</span>
            <button
              style={{ marginLeft: 10 }}
              onClick={() => setSelectedStudent(child)}
            >
              Xem thông tin
            </button>
          </div>
        ))
      )}

      {selectedStudent && (
        <div style={{ marginTop: 20 }}>
          <Profile overrideUser={selectedStudent} />
        </div>
      )}
    </div>
  );
}
