import axios from "axios";

const API_URL = "http://localhost:8000"; // backend đang chạy port 8000

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Nếu muốn tự động gắn token sau khi login
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // lưu trong localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
