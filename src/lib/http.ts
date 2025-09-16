// src/api/axiosConfig.ts
import axios from "axios";

// ================== Config API URL ==================
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";

// Hàm lấy baseURL an toàn, đồng bộ localhost/LAN/production
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    // Browser environment
    const hostname = window.location.hostname;
    if (hostname === "localhost") {
      return `http://localhost:${BACKEND_PORT}/api`; // dev localhost
    } else {
      return `http://${hostname}:${BACKEND_PORT}/api`; // LAN hoặc production
    }
  }

  // Node.js environment (test hoặc SSR)
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }

  // Fallback
  return `http://localhost:${BACKEND_PORT}/api`;
};

const API_URL = getBaseURL();

// ================== Axios Instance ==================
const http = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // timeout 30s
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
