// src/pages/Profile/AdminProfile.tsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosConfig";
import { INews } from "../../../types/news";

interface ILockResp {
  locked: boolean;
}

const AdminProfile: React.FC = () => {
  const [pendingNews, setPendingNews] = useState<INews[]>([]);
  const [locked, setLocked] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // ----- Lấy tin tức chờ duyệt -----
  const fetchNews = async () => {
    try {
      const res = await axiosInstance.get<INews[]>("/api/admin/news/pending");
      setPendingNews(res.data || []);
      setErrorMsg("");
    } catch (err: any) {
      console.warn("⚠️ fetchNews error:", err);
      setPendingNews([]);
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể lấy tin tức chờ duyệt"
      );
    }
  };

  // ----- Lấy trạng thái khóa điểm -----
  const fetchLockStatus = async () => {
    try {
      const res = await axiosInstance.get<ILockResp>(
        "/api/admin/grades/status"
      );
      setLocked(!!res.data.locked);
      setErrorMsg("");
    } catch (err: any) {
      console.warn("⚠️ fetchLockStatus error:", err);
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể lấy trạng thái khóa điểm"
      );
    }
  };

  // ----- Toggle khóa/mở điểm -----
  const toggleLock = async () => {
    try {
      if (locked) {
        await axiosInstance.post("/api/admin/grades/unlock");
        setLocked(false);
      } else {
        await axiosInstance.post("/api/admin/grades/lock");
        setLocked(true);
      }
    } catch (err: any) {
      console.warn("⚠️ toggleLock error:", err);
      alert("Không thể thay đổi trạng thái khóa điểm!");
    }
  };

  useEffect(() => {
    fetchNews();
    fetchLockStatus();

    // Polling trạng thái khóa điểm mỗi 30 giây để giáo viên cũng nhận cập nhật
    const iv = setInterval(() => {
      fetchLockStatus().catch(() => {
        /* swallow error, đã log trong fetchLockStatus */
      });
    }, 30000);

    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Trang quản trị Admin</h1>

      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

      {/* Tin tức chờ duyệt */}
      <section style={{ marginTop: "20px" }}>
        <h2>Tin tức chờ duyệt</h2>
        {pendingNews.length > 0 ? (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "10px",
            }}
          >
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Tiêu đề
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Tác giả
                </th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>
                  Ngày tạo
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingNews.map((news) =>
                news.id ? (
                  <tr key={news.id}>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {news.title}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {news.author || "N/A"}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                      {news.createdAt
                        ? new Date(news.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        ) : (
          <p>Không có tin tức nào chờ duyệt.</p>
        )}
      </section>

      {/* Trạng thái khóa điểm */}
      <section style={{ marginTop: "40px" }}>
        <h2>Trạng thái khóa điểm</h2>
        <p>
          Hiện tại:{" "}
          <strong style={{ color: locked ? "red" : "green" }}>
            {locked ? "🔒 Đang khóa điểm" : "🔓 Chưa khóa điểm"}
          </strong>
        </p>
        <button
          onClick={toggleLock}
          style={{
            padding: "8px 16px",
            background: locked ? "orange" : "blue",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {locked ? "Mở khóa điểm" : "Khóa điểm"}
        </button>
      </section>
    </div>
  );
};

export default AdminProfile;
