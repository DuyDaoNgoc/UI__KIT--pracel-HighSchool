import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../api/axiosConfig";

interface ICreatedStudent {
  _id: string;
  studentId?: string;
  name: string;
  dob?: string;
  gender?: string;
  address?: string;
  residence?: string;
  grade?: string | number;
  classLetter?: string;
  major?: string;
  classCode?: string;
  teacherName?: string;
}

interface ClassData {
  _id: string;
  classCode: string;
  teacherName?: string;
  students: ICreatedStudent[];
}

export default function ClassesTab() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<{ _id: string; name: string }[]>([]);
  const [openClassKey, setOpenClassKey] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<ICreatedStudent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [reloadClasses, setReloadClasses] = useState<boolean>(false);

  // ========================= FETCH DANH SÁCH GIÁO VIÊN =========================
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axiosInstance.get("/teachers");
        if (res.data && Array.isArray(res.data.data)) {
          setTeachers(res.data.data);
        } else {
          setTeachers([]);
        }
      } catch (err) {
        console.error("⚠️ fetch teachers error:", err);
        setTeachers([]);
      }
    };
    fetchTeachers();
  }, []);

  // ========================= FETCH DANH SÁCH HỌC SINH =========================
  const fetchAllStudents = async () => {
    try {
      const res = await axiosInstance.get("/students");
      if (res.data && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      console.error("⚠️ fetch students error:", err);
      return [];
    }
  };

  // ========================= FETCH DANH SÁCH LỚP =========================
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/classes");
        const allStudents = await fetchAllStudents(); // fetch tất cả học sinh
        const studentMap = new Map(allStudents.map((s: any) => [s._id, s]));

        if (res.data && Array.isArray(res.data.data)) {
          const mapped: ClassData[] = res.data.data.map((cls: any) => {
            const teacher = teachers.find(
              (t) => String(t._id) === String(cls.teacherId),
            );
            const teacherName = teacher?.name || cls.teacherName || "Chưa gán";

            const students: ICreatedStudent[] = (cls.studentIds || []).map(
              (sid: any) => {
                const st = typeof sid === "object" ? sid : studentMap.get(sid);
                return st
                  ? {
                      _id: st._id,
                      studentId: st.studentId,
                      name: st.name,
                      dob: st.dob,
                      gender: st.gender,
                      address: st.address,
                      residence: st.residence,
                      grade: cls.grade,
                      classLetter: cls.classLetter,
                      major: cls.major,
                      classCode: cls.classCode,
                      teacherName,
                    }
                  : {
                      _id: typeof sid === "string" ? sid : sid._id,
                      name: "-",
                      teacherName,
                      classCode: cls.classCode,
                      grade: cls.grade,
                      classLetter: cls.classLetter,
                      major: cls.major,
                    };
              },
            );

            return {
              _id: cls._id || cls.classCode,
              classCode: cls.classCode,
              teacherName,
              students,
            };
          });

          setClasses(mapped);
        } else {
          setClasses([]);
        }
      } catch (err) {
        console.error("⚠️ fetch classes error:", err);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [teachers, reloadClasses]);

  // ========================= TOGGLE LỚP =========================
  const toggleClass = (key: string) => {
    setOpenClassKey(openClassKey === key ? null : key);
    setSelectedStudent(null);
  };

  // ========================= FORMAT NGÀY =========================
  const formatDate = (dob?: string) =>
    dob ? new Date(dob).toLocaleDateString("vi-VN") : "-";

  // ========================= REFRESH LỚP =========================
  const refreshClasses = () => setReloadClasses((prev) => !prev);

  // ========================= LẮNG NGHE SỰ KIỆN GÁN GV =========================
  useEffect(() => {
    const handleAssigned = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/classes");
        const allStudents = await fetchAllStudents();
        const studentMap = new Map(allStudents.map((s: any) => [s._id, s]));

        if (res.data && Array.isArray(res.data.data)) {
          const mapped: ClassData[] = res.data.data.map((cls: any) => {
            const teacher = teachers.find(
              (t) => String(t._id) === String(cls.teacherId),
            );
            const teacherName = teacher?.name || cls.teacherName || "Chưa gán";

            const students: ICreatedStudent[] = (cls.studentIds || []).map(
              (sid: any) => {
                const st = typeof sid === "object" ? sid : studentMap.get(sid);
                return st
                  ? {
                      _id: st._id,
                      studentId: st.studentId,
                      name: st.name,
                      dob: st.dob,
                      gender: st.gender,
                      address: st.address,
                      residence: st.residence,
                      grade: cls.grade,
                      classLetter: cls.classLetter,
                      major: cls.major,
                      classCode: cls.classCode,
                      teacherName,
                    }
                  : {
                      _id: typeof sid === "string" ? sid : sid._id,
                      name: "-",
                      teacherName,
                      classCode: cls.classCode,
                      grade: cls.grade,
                      classLetter: cls.classLetter,
                      major: cls.major,
                    };
              },
            );

            return {
              _id: cls._id || cls.classCode,
              classCode: cls.classCode,
              teacherName,
              students,
            };
          });

          setClasses(mapped);
        }
      } catch (err) {
        console.error("⚠️ fetch classes error:", err);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener("teacherAssigned", handleAssigned);
    return () => window.removeEventListener("teacherAssigned", handleAssigned);
  }, [teachers]);

  // ========================= LẮNG NGHE HỌC SINH MỚI VÀ XOÁ =========================
  useEffect(() => {
    const handleNewStudent = (e: any) => {
      const student: ICreatedStudent = e.detail;

      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.classCode === student.classCode) {
            const exists = cls.students.some((s) => s._id === student._id);
            if (exists) return cls;
            return {
              ...cls,
              students: [
                ...cls.students,
                { ...student, teacherName: cls.teacherName },
              ],
            };
          }
          return cls;
        }),
      );
    };

    const handleDeletedStudent = (e: any) => {
      const studentId: string = e.detail._id;

      setClasses((prev) =>
        prev.map((cls) => ({
          ...cls,
          students: cls.students.filter((s) => s._id !== studentId),
        })),
      );
    };

    window.addEventListener("studentAddedToClass", handleNewStudent);
    window.addEventListener("studentDeletedFromClass", handleDeletedStudent);

    return () => {
      window.removeEventListener("studentAddedToClass", handleNewStudent);
      window.removeEventListener(
        "studentDeletedFromClass",
        handleDeletedStudent,
      );
    };
  }, []);

  // ========================= RENDER =========================
  return (
    <div className="profile__card">
      <h2 className="profile__title">Quản lý lớp</h2>

      {loading ? (
        <p>Đang tải lớp...</p>
      ) : classes.length === 0 ? (
        <p className="no-class">Chưa có lớp nào.</p>
      ) : (
        classes.map((cls) => {
          const isOpen = openClassKey === cls.classCode;
          return (
            <div key={cls._id} className="class-block">
              <button
                onClick={() => toggleClass(cls.classCode)}
                className="class-btn"
              >
                {cls.classCode} ({cls.students.length} HS) - GV:{" "}
                {cls.teacherName || "Chưa gán"}
              </button>

              {isOpen && (
                <table className="profile__table mt-2">
                  <thead>
                    <tr>
                      <th>Mã HS</th>
                      <th>Tên</th>
                      <th>Ngày sinh</th>
                      <th>Địa chỉ</th>
                      <th>Hộ khẩu</th>
                      <th>GV phụ trách</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cls.students.map((s) => (
                      <tr key={s.studentId || s._id}>
                        <td>{s.studentId}</td>
                        <td>{s.name}</td>
                        <td>{formatDate(s.dob)}</td>
                        <td>{s.address || "-"}</td>
                        <td>{s.residence || "-"}</td>
                        <td>{s.teacherName || "Chưa gán"}</td>
                        <td>
                          <button
                            className="view-btn"
                            onClick={() =>
                              setSelectedStudent(
                                selectedStudent?.studentId === s.studentId
                                  ? null
                                  : s,
                              )
                            }
                          >
                            Xem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })
      )}

      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Thông tin học sinh: {selectedStudent.name}</h3>
            <table className="modal-table">
              <tbody>
                <tr>
                  <td>Mã HS:</td>
                  <td>{selectedStudent.studentId}</td>
                </tr>
                <tr>
                  <td>Ngày sinh:</td>
                  <td>{formatDate(selectedStudent.dob)}</td>
                </tr>
                <tr>
                  <td>Giới tính:</td>
                  <td>{selectedStudent.gender || "-"}</td>
                </tr>
                <tr>
                  <td>Địa chỉ:</td>
                  <td>{selectedStudent.address || "-"}</td>
                </tr>
                <tr>
                  <td>Hộ khẩu:</td>
                  <td>{selectedStudent.residence || "-"}</td>
                </tr>
                <tr>
                  <td>Lớp:</td>
                  <td>{selectedStudent.classCode || "-"}</td>
                </tr>
                <tr>
                  <td>GV phụ trách:</td>
                  <td>{selectedStudent.teacherName || "-"}</td>
                </tr>
              </tbody>
            </table>

            <button
              className="modal-close"
              onClick={() => setSelectedStudent(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
