import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import axiosInstance from "../../../../api/axiosConfig";

interface Payment {
  _id: string;
  studentId: string;
  subjectId: string;
  amount: number;
  status: "paid" | "unpaid";
  date: string;
  studentName?: string;
  subjectName?: string;
}

interface Student {
  _id: string;
  studentId: string;
  name: string;
}

interface Subject {
  _id: string;
  name: string;
  price: number;
}

export default function PaymentTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">(
    "all",
  );

  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, studentsRes, subjectsRes] = await Promise.all([
          axiosInstance.get<{ data: Payment[] }>("/payments"),
          axiosInstance.get<{ data: Student[] }>("/students"),
          axiosInstance.get<{ data: Subject[] }>("/subjects"),
        ]);

        setPayments(paymentsRes.data?.data || []);
        setStudents(studentsRes.data?.data || []);
        setSubjects(subjectsRes.data?.data || []);
      } catch (err) {
        console.error("fetchData error:", err);
        toast.error("Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateStatus = async (
    paymentId: string,
    newStatus: "paid" | "unpaid",
  ) => {
    try {
      const res = await axiosInstance.patch<{ payment: Payment }>(
        `/payments/${paymentId}`,
        { status: newStatus },
      );
      if (res.data?.payment) {
        setPayments((prev) =>
          prev.map((p) => (p._id === paymentId ? res.data.payment : p)),
        );
        toast.success("Cập nhật trạng thái thành công");
      }
    } catch (err: any) {
      console.error("handleUpdateStatus error:", err);
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s._id === studentId);
    return student?.name || "Không xác định";
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s._id === subjectId);
    return subject?.name || "Không xác định";
  };

  const filteredPayments = payments.filter((p) => {
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchSearch =
      getStudentName(p.studentId)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      getSubjectName(p.subjectId).toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = filteredPayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="profile__card">
      <h2 className="profile__title">Quản lý học phí</h2>

      {/* Thống kê */}
      <div className="stats-container mb-3">
        <div className="stat-box">
          <h4>Tổng học phí</h4>
          <p className="stat-value">
            {totalAmount.toLocaleString("vi-VN")} VND
          </p>
        </div>
        <div className="stat-box">
          <h4>Đã thu</h4>
          <p className="stat-value success">
            {paidAmount.toLocaleString("vi-VN")} VND
          </p>
        </div>
        <div className="stat-box">
          <h4>Chưa thu</h4>
          <p className="stat-value warning">
            {(totalAmount - paidAmount).toLocaleString("vi-VN")} VND
          </p>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="filter-bar mb-2">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm học sinh, môn học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-buttons">
          <button
            onClick={() => setFilterStatus("all")}
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
          >
            Tất cả ({payments.length})
          </button>
          <button
            onClick={() => setFilterStatus("paid")}
            className={`filter-btn ${filterStatus === "paid" ? "active" : ""}`}
          >
            Đã thanh toán ({payments.filter((p) => p.status === "paid").length})
          </button>
          <button
            onClick={() => setFilterStatus("unpaid")}
            className={`filter-btn ${filterStatus === "unpaid" ? "active" : ""}`}
          >
            Chưa thanh toán (
            {payments.filter((p) => p.status === "unpaid").length})
          </button>
        </div>
      </div>

      {/* Danh sách học phí */}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : filteredPayments.length === 0 ? (
        <p className="no-data">Chưa có khoản học phí nào.</p>
      ) : (
        <table className="profile__table">
          <thead>
            <tr>
              <th>Học sinh</th>
              <th>Môn học</th>
              <th>Số tiền (VND)</th>
              <th>Trạng thái</th>
              <th>Ngày</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment._id}>
                <td>{getStudentName(payment.studentId)}</td>
                <td>{getSubjectName(payment.subjectId)}</td>
                <td>{payment.amount.toLocaleString("vi-VN")}</td>
                <td>
                  <span className={`status-badge ${payment.status}`}>
                    {payment.status === "paid"
                      ? "✓ Đã thanh toán"
                      : "✕ Chưa thanh toán"}
                  </span>
                </td>
                <td>{new Date(payment.date).toLocaleDateString("vi-VN")}</td>
                <td>
                  {payment.status === "unpaid" ? (
                    <button
                      onClick={() => handleUpdateStatus(payment._id, "paid")}
                      className="action-btn success"
                    >
                      Đánh dấu đã thanh toán
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(payment._id, "unpaid")}
                      className="action-btn warning"
                    >
                      Đánh dấu chưa thanh toán
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
