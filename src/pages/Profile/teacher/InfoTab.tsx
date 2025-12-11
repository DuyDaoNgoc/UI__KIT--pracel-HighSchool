import React from "react";
import { IUserProfile } from "../../../types/profiles";

interface Props {
  user: IUserProfile;
}

export default function TeacherInfo({ user }: Props) {
  return (
    <div className="profile__card text__content--size-12">
      <h2>Thông tin giáo viên</h2>
      <p>
        <b>Email:</b> {user.email}
      </p>
      <p>
        <b>Số điện thoại:</b> {user.phone ?? "Chưa cập nhật"}
      </p>
      <p>
        <b>Địa chỉ:</b> {user.address ?? "Chưa cập nhật"}
      </p>
      <p>
        <b>Mã giáo viên:</b> {user.teacherId ?? "N/A"}
      </p>
      <p>
        <b>Chuyên môn:</b>{" "}
        {typeof user.major === "string"
          ? user.major
          : user.major
            ? `${user.major.name} (${user.major.code})`
            : "Chưa cập nhật"}
      </p>
    </div>
  );
}
