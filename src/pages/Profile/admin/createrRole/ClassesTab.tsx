import React, { useState, useEffect } from "react";
import axiosInstance from "../../../../api/axiosConfig";
import { ICreatedStudent } from "../../../../types/student";
import StudentModal from "../StudentModal"; // ✅ import modal

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
  const [loading, setLoading] = useState(false);
  const [reloadClasses, setReloadClasses] = useState(false);
  const [search, setSearch] = useState(""); // ✅ state tìm kiếm

  // ========================= FETCH DANH SÁCH GIÁO VIÊN =========================
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axiosInstance.get("/teachers");
        setTeachers(res.data?.data || []);
      } catch (err) {
        console.error("fetchTeachers error:", err);
      }
    };
    fetchTeachers();
  }, []);

  // ========================= FETCH DANH SÁCH LỚP =========================
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/classes");

        const mapped: ClassData[] = (res.data?.data || []).map((cls: any) => {
          let students: ICreatedStudent[] = (cls.students || []).map(
            (s: any) => ({
              _id: s._id,
              studentId: s.studentId || "-",
              name: s.name || s.username || "-",
              dob: s.dob || "-",
              address: s.address || "-",
              grade: s.grade || cls.grade,
              classLetter: s.classLetter || cls.classLetter,
              classCode: cls.classCode,
              teacherName: cls.teacherName || "Chưa gán",
              major:
                s.major ||
                cls.classCode.match(/[A-Z]+$/i)?.[0] ||
                "Chưa xác định",
            }),
          );

          // Loại bỏ học sinh không tồn tại
          students = students.filter(
            (s) => s._id && s.name && s.studentId !== "-",
          );

          return {
            _id: cls._id || cls.classCode,
            classCode: cls.classCode,
            teacherName: cls.teacherName || "Chưa gán",
            students,
          };
        });

        setClasses(mapped);
      } catch (err) {
        console.error("fetchClasses error:", err);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [reloadClasses]);

  // ========================= TOGGLE LỚP =========================
  const toggleClass = (key: string) => {
    setOpenClassKey(openClassKey === key ? null : key);
    setSelectedStudent(null);
  };

  // ========================= HANDLE STUDENT ADDED / DELETED =========================
  useEffect(() => {
    const handleStudentAdded = (e: any) => {
      const student: ICreatedStudent = e.detail;
      setClasses((prev) =>
        prev.map((cls) => {
          if (
            cls.classCode === student.classCode &&
            !cls.students.some((s) => s._id === student._id)
          ) {
            return { ...cls, students: [...cls.students, student] };
          }
          return cls;
        }),
      );
    };

    const handleStudentDeleted = (e: any) => {
      const studentId: string = e.detail._id;
      setClasses((prev) =>
        prev.map((cls) => ({
          ...cls,
          students: cls.students.filter((s) => s._id !== studentId),
        })),
      );
    };

    window.addEventListener("studentAddedToClass", handleStudentAdded);
    window.addEventListener("studentDeletedFromClass", handleStudentDeleted);
    return () => {
      window.removeEventListener("studentAddedToClass", handleStudentAdded);
      window.removeEventListener(
        "studentDeletedFromClass",
        handleStudentDeleted,
      );
    };
  }, []);

  const formatDate = (dob?: string) =>
    dob ? new Date(dob).toLocaleDateString("vi-VN") : "-";

  // ========================= PHÂN LOẠI THEO NGÀNH =========================
  const getClassesByMajor = () => {
    const grouped: { [major: string]: ClassData[] } = {};

    classes.forEach((cls) => {
      // Lấy ngành từ học sinh đầu tiên
      const major = cls.students[0]?.major || "Chưa xác định";

      if (!grouped[major]) grouped[major] = [];
      grouped[major].push(cls);
    });

    // ✅ Lọc theo search
    if (search.trim()) {
      const lower = search.trim().toLowerCase();
      Object.keys(grouped).forEach((major) => {
        grouped[major] = grouped[major].filter(
          (cls) =>
            cls.classCode.toLowerCase().includes(lower) ||
            cls.teacherName?.toLowerCase().includes(lower) ||
            major.toLowerCase().includes(lower),
        );
      });
    }

    return grouped;
  };

  const classesByMajor = getClassesByMajor();

  // ========================= RENDER =========================
  return (
    <div className="profile__card">
      <h2 className="profile__title">Quản lý lớp</h2>

      {/* ========================= SEARCH ========================= */}
      <div className="search-bar mb-2">
        <input
          type="text"
          placeholder="Tìm kiếm lớp, ngành, GV..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Đang tải lớp...</p>
      ) : classes.length === 0 ? (
        <p className="no-class">Chưa có lớp nào.</p>
      ) : (
        Object.keys(classesByMajor).map((major) => (
          <div key={major} className="major-block">
            <h3 className="major-title">{major}</h3>
            {classesByMajor[major].map((cls) => {
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
                          <th>GV phụ trách</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cls.students.map((s) => (
                          <tr key={s._id}>
                            <td>{s.studentId}</td>
                            <td>{s.name}</td>
                            <td>{formatDate(s.dob)}</td>
                            <td>{s.address || "-"}</td>
                            <td>{s.teacherName || "Chưa gán"}</td>
                            <td>
                              <button
                                className="view-btn"
                                onClick={() => setSelectedStudent(s)}
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
            })}
          </div>
        ))
      )}

      {/* ========================= MODAL ========================= */}
      <StudentModal
        viewing={!!selectedStudent}
        selectedStudent={selectedStudent}
        closeView={() => setSelectedStudent(null)}
        assignTeacher={(id: string) => console.log("assignTeacher", id)}
        deleteStudent={(id: string) =>
          window.dispatchEvent(
            new CustomEvent("studentDeletedFromClass", { detail: { _id: id } }),
          )
        }
      />
    </div>
  );
}
