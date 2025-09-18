// src/pages/Profile/TeacherProfile/InfoTab.tsx
import React from "react";
import type { FEUser } from "./types";

interface Props {
  teacher: FEUser;
}

export default function InfoTab({ teacher }: Props) {
  return (
    <section>
      <h3>Thông tin giáo viên</h3>
      <p>
        <strong>Tên:</strong> {teacher.username}
      </p>
      <p>
        <strong>Email:</strong> {teacher.email}
      </p>
      <p style={{ color: "#666" }}>
        Trang này dùng để quản lý học sinh, gửi yêu cầu cập nhật điểm, và xem
        báo cáo hàng ngày. Trạng thái khóa điểm do admin điều khiển.
      </p>
    </section>
  );
}
