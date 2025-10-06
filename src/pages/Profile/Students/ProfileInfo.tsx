import React from "react";
import { IUserProfile } from "../../../types/profiles";

interface ProfileInfoProps {
  user: IUserProfile;
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
  return (
    <div className="profile__card text__content--size-12">
      <h2>Thông tin cá nhân</h2>
      <p>
        <b>Email:</b> {user.email}
      </p>
      <p>
        <b>Lớp:</b>{" "}
        {typeof user.classCode === "string"
          ? user.classCode
          : user.classCode
          ? `${user.classCode.className} (${user.classCode.grade})`
          : "Chưa cập nhật"}
      </p>
      <p>
        <b>Ngành:</b>{" "}
        {typeof user.major === "string"
          ? user.major
          : user.major
          ? `${user.major.name} (${user.major.code})`
          : "Chưa cập nhật"}
      </p>
      <p>
        <b>Năm học:</b> {user.schoolYear ?? "Chưa cập nhật"}
      </p>
      <p>
        <b>Số điện thoại:</b> {user.phone ?? "Chưa cập nhật"}
      </p>
      <p>
        <b>Địa chỉ:</b> {user.address ?? "Chưa cập nhật"}
      </p>
    </div>
  );
}
