// Deprecated file - use PaymentTab.tsx instead
// This file can be safely deleted

interface StudentTuition {
  _id: string;
  tuitionId: string;
  studentId: Student;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "unpaid" | "partial" | "paid";
  notes?: string;
}

export default function PaymentTab() {
  const [studentTuitions, setStudentTuitions] = useState<StudentTuition[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "paid" | "partial" | "unpaid"
  >("all");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<number>(0);
  const [editingStatus, setEditingStatus] = useState<
    "unpaid" | "partial" | "paid"
  >("unpaid");

  // Fetch dữ liệu
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get<{ data: StudentTuition[] }>(
        "/student-tuition",
      );
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setStudentTuitions(data);
      console.log("✅ Loaded student tuitions:", data.length);
    } catch (err: any) {
      console.error("❌ Fetch error:", err);
      toast.error(err.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // Socket listeners
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const reload = () => fetchData();
    socket.on("student-tuition:updated", reload);
    socket.on("student-tuition:created", reload);
    return () => {
      socket.off("student-tuition:updated", reload);
      socket.off("student-tuition:created", reload);
    };
  }, [socket]);

  const handleUpdatePayment = async (studentTuitionId: string) => {
    if (editingAmount < 0 || editingAmount > 100000000000) {
      toast.error("Số tiền không hợp lệ");
      return;
    }

    try {
      const res = await axiosInstance.put<{ data: StudentTuition }>(
        `/student-tuition/${studentTuitionId}`,
        {
          paidAmount: editingAmount,
          status: editingStatus,
        },
      );

      if (res.data?.data) {
        setStudentTuitions((prev) =>
          prev.map((st) => (st._id === studentTuitionId ? res.data.data : st)),
        );
        setEditingId(null);
        toast.success("✅ Cập nhật thành công");
      }
    } catch (err: any) {
      console.error("❌ Update error:", err);
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const filteredTuitions = studentTuitions.filter((st) => {
    const matchStatus = filterStatus === "all" || st.status === filterStatus;
    const matchSearch =
      st.studentId?.name.toLowerCase().includes(search.toLowerCase()) ||
      st.studentId?.studentId.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalAmount = filteredTuitions.reduce(
    (sum, st) => sum + st.totalAmount,
    0,
  );
  const paidAmount = filteredTuitions.reduce(
    (sum, st) => sum + st.paidAmount,
    0,
  );
  const remainingAmount = filteredTuitions.reduce(
    (sum, st) => sum + st.remainingAmount,
    0,
  );

  return (
    <div className="profile__card"
      <h2 className="profile__title">    Quản lý thanh toán học phí</h2>

      {/* Thống kê tổng quan */}
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
            {remainingAmount.toLocaleString("vi-VN")} VND
          </p>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="filter-bar mb-2">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm mã HS, tên học sinh..."
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
            Tất cả ({studentTuitions.length})
          </button>
          <button
            onClick={() => setFilterStatus("paid")}
            className={`filter-btn ${filterStatus === "paid" ? "active" : ""}`}
          >
            ✅ Đã thanh toán (
            {studentTuitions.filter((st) => st.status === "paid").length})
          </button>
          <button
            onClick={() => setFilterStatus("partial")}
            className={`filter-btn ${filterStatus === "partial" ? "active" : ""}`}
          >
            ⚠️ Trả một phần (
            {studentTuitions.filter((st) => st.status === "partial").length})
          </button>
          <button
            onClick={() => setFilterStatus("unpaid")}
            className={`filter-btn ${filterStatus === "unpaid" ? "active" : ""}`}
          >
            ❌ Chưa thanh toán (
            {studentTuitions.filter((st) => st.status === "unpaid").length})
          </button>
        </div>
      </div>

      {/* Danh sách học phí */}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : filteredTuitions.length === 0 ? (
        <p className="no-data">Chưa có khoản học phí nào.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="profile__table">
            <thead>
              <tr>
                <th>Mã HS</th>
                <th>Tên học sinh</th>
                <th>Tổng nợ (VND)</th>
                <th>Đã trả (VND)</th>
                <th>Còn nợ (VND)</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredTuitions.map((st) => (
                <tr
                  key={st._id}
                  style={{
                    backgroundColor:
                      st.status === "paid"
                        ? "#f1f8e9"
                        : st.status === "partial"
                          ? "#fff9c4"
                          : "white",
                  }}
                >
                  <td style={{ fontWeight: "bold" }}>
                    {st.studentId?.studentId || "-"}
                  </td>
                  <td>{st.studentId?.name || "-"}</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    {st.totalAmount.toLocaleString("vi-VN")}
                  </td>
                  <td style={{ textAlign: "right", color: "#2e7d32" }}>
                    {editingId === st._id ? (
                      <input
                        type="number"
                        value={editingAmount}
                        onChange={(e) =>
                          setEditingAmount(Number(e.target.value))
                        }
                        style={{
                          width: "100px",
                          padding: "6px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      />
                    ) : (
                      st.paidAmount.toLocaleString("vi-VN")
                    )}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: st.remainingAmount > 0 ? "#f44336" : "#2e7d32",
                      fontWeight: "bold",
                    }}
                  >
                    {st.remainingAmount.toLocaleString("vi-VN")}
                  </td>
                  <td>
                    {editingId === st._id ? (
                      <select
                        value={editingStatus}
                        onChange={(e) =>
                          setEditingStatus(
                            e.target.value as "unpaid" | "partial" | "paid",
                          )
                        }
                        style={{
                          padding: "4px 8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      >
                        <option value="unpaid">❌ Chưa trả</option>
                        <option value="partial">⚠️ Trả một phần</option>
                        <option value="paid">✅ Đã trả</option>
                      </select>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          backgroundColor:
                            st.status === "paid"
                              ? "#c8e6c9"
                              : st.status === "partial"
                                ? "#fff9c4"
                                : "#ffcdd2",
                          color:
                            st.status === "paid"
                              ? "#1b5e20"
                              : st.status === "partial"
                                ? "#f57f17"
                                : "#b71c1c",
                        }}
                      >
                        {st.status === "paid"
                          ? "✅ Đã trả"
                          : st.status === "partial"
                            ? "⚠️ Trả một phần"
                            : "❌ Chưa trả"}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingId === st._id ? (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          onClick={() => handleUpdatePayment(st._id)}
                          style={{
                            padding: "6px 10px",
                            background: "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          💾 Lưu
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: "6px 10px",
                            background: "#999",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(st._id);
                          setEditingAmount(st.paidAmount);
                          setEditingStatus(st.status);
                        }}
                        style={{
                          padding: "6px 10px",
                          background: "#FF9800",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        ✏️ Sửa
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
