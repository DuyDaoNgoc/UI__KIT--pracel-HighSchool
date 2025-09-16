// src/api/axiosConfig.ts
import axios from "axios";

// ================== Config API URL ==================
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";

// Lấy IP LAN động, nhưng an toàn với SSR hoặc test env
const getBaseURL = () => {
  // Nếu đang chạy trong browser
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost") {
      return `http://192.168.10.30:${BACKEND_PORT}/api`; // IP LAN dev
    } else {
      return `http://${hostname}:${BACKEND_PORT}/api`; // Production hoặc LAN khác
    }
  }

  // Nếu đang chạy trong Node.js (test, SSR)
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }

  // Fallback mặc định
  return `http://localhost:${BACKEND_PORT}/api`;
};

const API_URL = getBaseURL();

// ================== Axios Instance ==================
const http = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // timeout 30s, tránh treo request
});

// ================== Interceptor thêm token ==================
http.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      if (!config.headers) config.headers = {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default http;

// ================== Ví dụ sử dụng ==================
// http.post("/auth/login", { email, password }) → LAN/localhost/prod đều ok
// http.get("/news") → LAN/localhost/prod đều ok
