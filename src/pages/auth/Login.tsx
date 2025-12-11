import React, { useState, useEffect } from "react";
import http from "../../lib/http";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Toaster, toast, Toast } from "react-hot-toast";
import { LogIn, LogOut, ArrowLeft } from "lucide-react";
const Login: React.FC = () => {
  // form state
  const [form, setForm] = useState({ username: "", password: "" });
  // loading state
  const [loading, setLoading] = useState(false);
  // message state
  const [message, setMessage] = useState("");
  // show/hide password
  const [showPassword, setShowPassword] = useState(false);
  // lock countdown
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);
  // router
  const navigate = useNavigate();
  // auth context
  const { login } = useAuth();

  // Countdown khi bị lock
  useEffect(() => {
    // lockSecondsLeft = 0 thì không cần chạy timer
    if (lockSecondsLeft <= 0) return;
    // Tạo timer giảm dần lockSecondsLeft
    const timer = setInterval(() => {
      // Mỗi giây giảm 1
      setLockSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    // Clear timer khi unmount hoặc lockSecondsLeft thay đổi
    return () => clearInterval(timer);
  }, [lockSecondsLeft]); // Chỉ chạy khi lockSecondsLeft thay đổi

  // Handle input change

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Cập nhật giá trị form tương ứng
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle form submit

  const handleSubmit = async (e: React.FormEvent) => {
    // Ngăn chặn reload trang
    e.preventDefault();
    //
    if (lockSecondsLeft > 0) return; // chặn submit khi đang lock
    // load state
    setLoading(true);
    // clear message
    setMessage("");

    try {
      // Gửi request đăng nhập tới backend
      // Chuyển username thành code để backend xử lý (studentId hoặc teacherId)
      const res = await http.post<any>("/auth/login", {
        code: form.username,
        password: form.password,
      });
      // Xử lý phản hồi từ backend
      const {
        success,
        token,
        user,
        message: msg,
        attemptsLeft,
        lockTime,
        isBlocked,
      } = res.data;

      // Kiểm tra tài khoản bị đình chỉ
      if (isBlocked) {
        setMessage("🚫 " + msg);
        toast.error(msg);
        return;
      }

      // Nếu đăng nhập thành công và có token, user
      if (success && token && user) {
        // Lưu token vào localStorage
        localStorage.setItem("token", token);
        // Cập nhật auth context
        login(user, token);
        // ✅ Điều hướng theo role
        if (user.role === "admin") {
          navigate("/admin");
          setTimeout(() => {
            toast.success(" Đăng nhập thành công!");
          }, 10);
        } else {
          navigate("/");
          setTimeout(() => {
            toast.success(" Đăng nhập thành công!");
          }, 10);
        }
      } else {
        // Đăng nhập thất bại, hiển thị thông báo lỗi từ backend
        let errorMsg = msg || "❌ Invalid email or password";

        // Hiển thị số lần thử còn lại
        if (attemptsLeft !== undefined) {
          errorMsg += ` | Attempts left: ${attemptsLeft}`;
        }

        // neu bi lock thi hien thi thoi gian lock
        if (lockTime && lockTime > 0) {
          // Bắt đầu đếm ngược
          setLockSecondsLeft(lockTime);
          // Hiển thị thời gian bị khóa
          errorMsg += ` | Locked for: ${lockTime}s`;
        }
        // Hiển thị lỗi
        setMessage(errorMsg);
      }
    } catch (err: any) {
      // Lỗi kết nối hoặc lỗi khác
      // Hiển thị lỗi từ backend hoặc lỗi kết nối
      const errorMessage =
        //Lỗi từ backend
        err?.response?.data?.message ||
        "❌ Cannot connect to server or invalid credentials";
      // Hiển thị lỗi
      setMessage(errorMessage);
    } finally {
      // Luôn tắt loading sau khi xử lý xong
      // Tắt loading
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          marginBottom: "1rem",
        }}
      >
        <div
          onClick={() => navigate("/")} // 🔙 quay lại trang vừa xem
        >
          <ArrowLeft size={32} />
        </div>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-form__h2">Login</h2>

        <label className="login-form__label" htmlFor="username">
          Mã học sinh / Mã giáo viên
        </label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="Nhập mã HS (26A70157) hoặc mã GV (GV00001)"
          value={form.username}
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
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default Login;
