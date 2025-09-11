import React, { useState } from "react";
import { http } from "../../lib/http";
import { RegisterResponse, Role } from "../../types/auth";
import { useNavigate } from "react-router-dom";

const Register: React.FC = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "student" as Role,
    dob: "",
    class: "",
    schoolYear: "",
    phone: "",
    address: "",
    children: [] as string[], // nếu là phụ huynh
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // riêng cho children (nhập nhiều con cách nhau bằng dấu phẩy)
  const handleChildrenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const children = value.split(",").map((c) => c.trim());
    setForm((s) => ({ ...s, children }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await http.post<RegisterResponse>("/auth/register", form);
      alert(res.data.message || "Registered!");
      navigate("/login");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Register error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>

      <input
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
      />
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

      <select name="role" value={form.role} onChange={handleChange}>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="parent">Parent</option>
      </select>

      <input name="dob" type="date" value={form.dob} onChange={handleChange} />
      <input
        name="class"
        placeholder="Class"
        value={form.class}
        onChange={handleChange}
      />
      <input
        name="schoolYear"
        placeholder="School Year"
        value={form.schoolYear}
        onChange={handleChange}
      />
      <input
        name="phone"
        placeholder="Phone"
        value={form.phone}
        onChange={handleChange}
      />
      <input
        name="address"
        placeholder="Address"
        value={form.address}
        onChange={handleChange}
      />

      {form.role === "parent" && (
        <input
          name="children"
          placeholder="Children IDs (comma separated)"
          onChange={handleChildrenChange}
        />
      )}

      <button type="submit" disabled={loading}>
        {loading ? "..." : "Register"}
      </button>
    </form>
  );
};

export default Register;
