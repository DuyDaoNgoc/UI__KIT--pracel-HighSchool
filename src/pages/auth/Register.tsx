import { useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../../lib/http"; // dùng cùng login
import { RegisterResponse } from "../../types/auth";

export default function Register() {
  const [accountType, setAccountType] = useState<"student" | "teacher">(
    "student",
  );
  const [code, setCode] = useState(""); // studentCode hoặc teacherCode
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("❌ Mật khẩu và nhập lại mật khẩu không khớp!");
      return;
    }

    try {
      const payload: any = { email, password };
      if (accountType === "student") payload.studentCode = code;
      else payload.teacherCode = code;

      const res = await http.post<RegisterResponse>("/auth/register", payload);

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
      <label className="login-form__label" htmlFor="accountType">
        Account Type
      </label>
      <select
        id="accountType"
        value={accountType}
        onChange={(e) =>
          setAccountType(e.target.value as "student" | "teacher")
        }
        className="login-form__input"
      >
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
      </select>
      <label className="login-form__label" htmlFor="code">
        {accountType === "student" ? "Student Code" : "Teacher Code"}
      </label>
      <input
        id="code"
        type="text"
        placeholder={
          accountType === "student" ? "Student Code" : "Teacher Code"
        }
        value={code}
        onChange={(e) => setCode(e.target.value)}
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
          type={showPassword ? "text" : "password"}
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
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      <label className="login-form__label" htmlFor="confirmPassword">
        Confirm Password
      </label>
      <input
        id="confirmPassword"
        type={showPassword ? "text" : "password"}
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
