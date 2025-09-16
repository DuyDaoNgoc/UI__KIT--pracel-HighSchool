import React, { useState, useEffect } from "react";
import http from "../../lib/http";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login: React.FC = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);

  const navigate = useNavigate();
  const { login } = useAuth();

  // Countdown khi bị lock
  useEffect(() => {
    if (lockSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setLockSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockSecondsLeft]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockSecondsLeft > 0) return; // chặn submit khi đang lock
    setLoading(true);
    setMessage("");

    try {
      const res = await http.post<any>("/auth/login", form);
      const {
        success,
        token,
        user,
        message: msg,
        attemptsLeft,
        lockTime,
      } = res.data;

      if (success && token && user) {
        localStorage.setItem("token", token);
        login(user, token);
        navigate("/");
      } else {
        let errorMsg = msg || "❌ Invalid email or password";

        // Hiển thị số lần thử còn lại
        if (attemptsLeft !== undefined) {
          errorMsg += ` | Attempts left: ${attemptsLeft}`;
        }

        // Nếu bị khóa
        if (lockTime && lockTime > 0) {
          setLockSecondsLeft(lockTime);
          errorMsg += ` | Locked for: ${lockTime}s`;
        }

        setMessage(errorMsg);
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        "❌ Cannot connect to server or invalid credentials";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2 className="login-form__h2">Login</h2>

      <label className="login-form__label" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
        disabled={lockSecondsLeft > 0}
        className="login-form__input"
      />

      <label className="login-form__label" htmlFor="password">
        Password
      </label>
      <div style={{ position: "relative" }}>
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          disabled={lockSecondsLeft > 0}
          className="login-form__input"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading || lockSecondsLeft > 0}
        className="login-form__button"
      >
        {loading
          ? "..."
          : lockSecondsLeft > 0
          ? `Locked (${lockSecondsLeft}s)`
          : "Login"}
      </button>

      <p style={{ marginTop: "10px" }}>
        <a href="/forgot-password">Quên mật khẩu?</a>
      </p>

      {message && <p className="login-form__message">{message}</p>}
    </form>
  );
};

export default Login;
