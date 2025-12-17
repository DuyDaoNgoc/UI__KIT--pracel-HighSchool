import React from "react";
import { IUserProfile } from "../../../types/profiles";

interface Props {
  user: IUserProfile;
}

export default function TeacherInfo({ user }: Props) {
  // Debug log
  React.useEffect(() => {
    console.log("[TeacherInfo] User data:", user);
    console.log("[TeacherInfo] assignedClass:", user.assignedClass);
  }, [user]);

  const roleLabel = (r?: string) => {
    if (!r || r === "") return "";
    if (r === "homeroom" || r === "chunhiem" || r === "chu-nhiem")
      return "Chủ nhiệm";
    if (r === "subjectHead" || r === "bomon" || r === "bomon") return "Bộ môn";
    if (r === "subjectTeacher" || r === "giaovienbomon")
      return "Giáo viên bộ môn";
    return r;
  };

  // Show only the homeroom class (Chủ nhiệm). Do not list subject classes here.
  const isHomeroom = (r?: string) =>
    !r
      ? false
      : ["homeroom", "chunhiem", "chu-nhiem", "chunhiem"].includes(
          r.toLowerCase(),
        );

  const homeroom = (user.assignedClass || []).find((c) => isHomeroom(c.role));

  const assignedClassesText = (() => {
    if (!homeroom) return "Không có lớp chủ nhiệm";

    // Concatenate grade + letter + abbreviated major, e.g. "26CCNTT"
    const abbr = (homeroom.major || "")
      .split(/\s+/)
      .map((w) => (w[0] || "").toUpperCase())
      .join("")
      .slice(0, 10);
    const code = `${homeroom.grade}${homeroom.classLetter}${abbr}`;
    return `${code} — Chủ nhiệm`;
  })();

  const majorsText =
    user.majors && user.majors.length > 0
      ? user.majors.join(", ")
      : "Not updated";

  return (
    <div className="profile__card text__content--size-12">
      <h2>Thông tin giáo viên</h2>
      <p>
        <b>Email:</b> {user.email}
      </p>
      <p>
        <b>Điện thoại:</b> {user.phone ?? "Chưa cập nhật"}
      </p>
      <p>
        <b>Địa chỉ:</b> {user.address ?? "Chưa cập nhật"}
      </p>
      <p>
        <b>Mã giáo viên:</b> {user.teacherId ?? "N/A"}
      </p>
      <p>
        <b>Chuyên môn:</b> {majorsText}
      </p>
      <p>
        <b>Lớp dạy:</b> {assignedClassesText}
      </p>
      {homeroom && (
        <p>
          <b>Niên khóa:</b> {homeroom.schoolYear ?? "Chưa cập nhật"}
        </p>
      )}
    </div>
  );
}
