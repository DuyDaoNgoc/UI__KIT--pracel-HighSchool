import React from "react";
import { ICredit } from "../../../types/profiles";

export default function ProfileCredits({
  credits,
}: {
  credits: ICredit | null;
}) {
  return (
    <div className="profile__card">
      <h2>Tín chỉ</h2>
      {credits ? (
        <>
          <p>
            <b>Tổng:</b> {credits.total}
          </p>
          <p>
            <b>Đã tích lũy:</b> {credits.earned}
          </p>
        </>
      ) : (
        <p>Không có dữ liệu</p>
      )}
    </div>
  );
}
