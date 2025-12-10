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

  // ========================= HELPERS: normalizeMajor + extractMajorFromClassCode =========================
  // Chuẩn hóa ngành -> Viết tắt theo chữ cái đầu (Công Nghệ Thông Tin -> CNTT)
  const normalizeMajor = (major?: string): string => {
    if (!major) return "Chưa xác định";

    const clean = major.trim();

    // Nếu đã là viết tắt (1 từ, không có khoảng trắng) -> giữ uppercase
    if (/^[A-Za-zÀ-ỹ]+$/.test(clean) && !clean.includes(" ")) {
      return clean.toUpperCase();
    }

    // Tách theo khoảng trắng -> lấy chữ cái đầu mỗi từ
    const parts = clean.split(/\s+/);
    const acronym = parts.map((w) => w[0]?.toUpperCase() ?? "").join("");

    return acronym || "Chưa xác định";
  };

  // Tách ngành từ classCode
  // Các dạng thông dụng:
  //  - "26A-CNTT" -> "CNTT"
  //  - "26ACNTT"  -> try fallback: lấy phần chữ in hoa cuối cùng
  //  - nếu không có dấu '-' và không parse được -> "Chưa xác định"
  const extractMajorFromClassCode = (code?: string): string => {
    if (!code) return "Chưa xác định";

    // Nếu có '-', phần sau '-' là ngành
    if (code.includes("-")) {
      const parts = code.split("-");
      const last = parts[parts.length - 1].trim();
      if (last) return last.toUpperCase();
    }

    // Nếu không có '-', thử match phần chữ in hoa cuối cùng (VD: 26ACNTT)
    const match = code.match(/[A-Z]{2,}$/i);
    if (match) return match[0].toUpperCase();

    return "Chưa xác định";
  };

  // Utility: thêm class vào nhóm major mà không duplicate
  const pushUnique = (
    grouped: { [major: string]: ClassData[] },
    major: string,
    cls: ClassData,
  ) => {
    if (!grouped[major]) grouped[major] = [];
    const exists = grouped[major].some((c) => c._id === cls._id);
    if (!exists) grouped[major].push(cls);
  };

  // ========================= FETCH DANH SÁCH GIÁO VIÊN =========================
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axiosInstance.get<{
          data: { _id: string; name: string }[];
        }>("/teachers");
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
        const res = await axiosInstance.get<{ data: any[] }>("/classes");

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
              major: normalizeMajor(s.major),
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

  // Rút gọn ngành thành viết tắt (CNTT, QTKD, etc.)
  const majorAbbrev = (major?: string): string => {
    if (!major) return "";
    return major
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() : ""))
      .join("");
  };

  // Tạo class code từ khối, lớp, và ngành
  const generateClassCode = (
    grade?: string,
    classLetter?: string,
    major?: string,
  ): string => {
    const g = grade || "X";
    const c = classLetter || "X";
    const abbr = majorAbbrev(major || "");
    return `${g}${c}${abbr}`;
  };

  const formatDate = (dob?: string) =>
    dob ? new Date(dob).toLocaleDateString("vi-VN") : "-";

  const getClassesByMajor = () => {
    const grouped: { [major: string]: ClassData[] } = {};

    classes.forEach((cls) => {
      // Chỉ lấy ngành từ classCode — đúng yêu cầu
      const classMajor = extractMajorFromClassCode(cls.classCode);

      if (!grouped[classMajor]) grouped[classMajor] = [];
      grouped[classMajor].push(cls);
    });

    // ========================= Lọc theo search =========================
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
        deleteStudent={(id: string) => {
          window.dispatchEvent(
            new CustomEvent("studentDeletedFromClass", { detail: { _id: id } }),
          );
          return true;
        }}
        generateClassCode={generateClassCode}
      />
    </div>
  );
}
