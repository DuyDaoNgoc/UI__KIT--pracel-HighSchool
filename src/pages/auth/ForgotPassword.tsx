import React, { useState } from "react";
import http from "../../api/axiosConfig";

const ForgotPassword: React.FC = () => {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await http.post("/auth/forgot-password", {
        emailOrCode: value,
      });
      if ((res as any)?.success) {
        setMessage((res as any).message || "Yêu cầu đã được gửi");
      } else {
        setMessage((res as any).message || "Yêu cầu đã được gửi");
      }
    } catch (err: any) {
      console.error("forgot-password error:", err);
      setError(err?.response?.data?.message || err.message || "Lỗi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "40px auto" }}>
      <h2>Quên mật khẩu</h2>
      <p>
        Nhập email hoặc mã học sinh/giáo viên để nhận hướng dẫn đặt lại mật
        khẩu.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Email hoặc mã (ví dụ: 26C12345)"
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi"}
          </button>
          <button type="button" onClick={() => setValue("")}>
            Hủy
          </button>
        </div>
      </form>

      {message && (
        <div style={{ marginTop: 12, color: "green" }}>{message}</div>
      )}
      {error && <div style={{ marginTop: 12, color: "red" }}>{error}</div>}
    </div>
  );
};

export default ForgotPassword;
