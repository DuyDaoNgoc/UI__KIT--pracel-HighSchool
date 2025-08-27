import React, { useState } from "react";
import { http } from "../../lib/http";
import { LoginResponse, User } from "../../types/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login: React.FC = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // context đòi SafeUser

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await http.post<LoginResponse>("/auth/login", form);
      const { user, token } = res.data;

      // ✅ ép FE User thành SafeUser (Date object)
      const safeUser = {
        ...user,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      };

      login(safeUser, token);
      alert("Login successful!");
      navigate("/");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Login error");
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
      />
      <label>Password</label>
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
