import React, { useState } from "react";
import { http } from "../../lib/http";
import { LoginResponse } from "../../types/auth";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await http.post<LoginResponse>("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      // Nếu muốn lưu user:
      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert("Login successful!");
      navigate("/"); // chuyển trang tuỳ bạn
    } catch (err: any) {
      alert(err?.response?.data?.message || "Login error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
      />
      <button type="submit" disabled={loading}>
        {loading ? "..." : "Login"}
      </button>
    </form>
  );
};

export default Login;
