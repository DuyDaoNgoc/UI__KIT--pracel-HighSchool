import { useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../lib/http"; // dùng cùng login
import { RegisterResponse } from "../../types/auth";

export default function Register() {
  const [studentCode, setStudentCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // Field nhập lại mật khẩu
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Toggle show/hide password
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    // Kiểm tra mật khẩu nhập lại
    if (password !== confirmPassword) {
      setMessage("❌ Mật khẩu và nhập lại mật khẩu không khớp!");
      return;
    }

    try {
      const res = await http.post<RegisterResponse>("/auth/register", {
        studentCode,
        email,
        password,
      });

      if (res.data.success) {
        setMessage("✅ Đăng ký thành công! Chuyển đến trang đăng nhập...");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setMessage(res.data.message || "❌ Đăng ký thất bại!");
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "❌ Lỗi kết nối server");
    }
  };

  return (
    <form className="login-form" onSubmit={handleRegister}>
      <h2 className="login-form__h2">Register</h2>

      <label className="login-form__label" htmlFor="studentCode">
        Student Code
      </label>
      <input
        id="studentCode"
        type="text"
        placeholder="Student Code"
        value={studentCode}
        onChange={(e) => setStudentCode(e.target.value)}
        required
        className="login-form__input"
      />

      <label className="login-form__label" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="login-form__input"
      />

      <label className="login-form__label" htmlFor="password">
        Password
      </label>
      <div style={{ position: "relative" }}>
        <input
          id="password"
          type={showPassword ? "text" : "password"} // <-- Toggle show/hide mật khẩu
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-form__input"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          {showPassword ? "Hide" : "Show"} {/* Nhãn nút toggle */}
        </button>
      </div>

      <label className="login-form__label" htmlFor="confirmPassword">
        Confirm Password
      </label>
      <input
        id="confirmPassword"
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        className="login-form__input"
      />

      <button type="submit" className="login-form__button">
        Register
      </button>

      {message && <p className="login-form__message">{message}</p>}
    </form>
  );
}
