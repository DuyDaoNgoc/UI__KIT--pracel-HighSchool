import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosConfig";
import { RegisterResponse } from "../../types/auth";

export default function Register() {
  const [studentCode, setStudentCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axiosInstance.post<RegisterResponse>(
        "/api/auth/register",
        { studentCode, email, password }
      );

      if (res.data.success) {
        setMessage("✅ Đăng ký thành công! Chuyển đến trang đăng nhập...");
        setTimeout(() => navigate("/login"), 1200); // ⏳ chờ 1.2s để user thấy message
      } else {
        setMessage(res.data.message || "❌ Đăng ký thất bại!");
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "❌ Lỗi kết nối server");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Register</h2>
      <form onSubmit={handleRegister} className="space-y-3">
        <input
          type="text"
          placeholder="Student Code"
          value={studentCode}
          onChange={(e) => setStudentCode(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Register
        </button>
      </form>

      {message && <p className="mt-3 text-center text-green-600">{message}</p>}
    </div>
  );
}
