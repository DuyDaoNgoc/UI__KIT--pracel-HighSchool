import React from "react";
import { ITuition } from "../../../types/profiles";

export default function ProfileTuition({
  tuition,
}: {
  tuition: ITuition | null;
}) {
  return (
    <div className="profile__card">
      <h2>Học phí</h2>
      {tuition ? (
        <>
          <p>
            <b>Tổng:</b> {tuition.total}
          </p>
          <p>
            <b>Đã đóng:</b> {tuition.paid}
          </p>
          <p>
            <b>Còn nợ:</b> {tuition.remaining}
          </p>
          <p>
            <b>Bán trú:</b> {tuition.daycare ?? "Không có dữ liệu"}
          </p>
          <p>
            <b>Nội trú:</b> {tuition.boarding ?? "Không có dữ liệu"}
          </p>
        </>
      ) : (
        <p>Không có dữ liệu</p>
      )}
    </div>
  );
}
