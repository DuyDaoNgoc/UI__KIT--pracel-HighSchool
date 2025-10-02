// src/api/axiosConfig.ts
import axios from "axios";

// ================== Config API URL ==================
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";

// ================== Lấy BaseURL động ==================
const getBaseURL = (): string => {
  // ===== Browser =====
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // ===== Dev: localhost / 127.0.0.1 → backend local
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://localhost:${BACKEND_PORT}/api`;
    }

    // ===== LAN (192.168.x.x)
    const lanRegex = /^192\.168\.\d+\.\d+$/;
    if (lanRegex.test(hostname)) {
      return `http://${hostname}:${BACKEND_PORT}/api`;
    }

    // ===== Production domain (UI-kit.com)
    if (process.env.NODE_ENV === "production") {
      return `https://UI-kit.com/api`;
    }

    // ===== Ngrok / staging / host public khác
    return `${window.location.origin}/api`;
  }

  // ===== Node.js / SSR / test env =====
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }

  // ===== Fallback mặc định
  return `http://localhost:${BACKEND_PORT}/api`;
};

const API_URL = getBaseURL();

// ================== Axios Instance ==================
const http = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 30s
});

// ================== Interceptor thêm token ==================
http.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        if (!config.headers) config.headers = {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default http;

// ================== Ví dụ ==================
// http.post("/auth/login", { email, password })
// http.get("/news")
