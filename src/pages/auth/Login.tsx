import React, { useState } from "react";
import { http } from "../../lib/http";
import { LoginResponse } from "../../types/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login: React.FC = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await http.post<LoginResponse>("/auth/login", form);
      const { success, user, token, message } = res.data;

      if (success) {
        login(user, token);
        navigate("/"); // ✅ chuyển sang trang chủ
      } else {
        setMessage(message || "❌ Unexpected response from server");
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || "❌ Cannot connect to server";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <label>Email</label>
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
      />
      <label>Password</label>
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "..." : "Login"}
      </button>

      {message && <p style={{ color: "red", marginTop: "8px" }}>{message}</p>}
    </form>
  );
};

export default Login;
