// src/api/axiosConfig.ts
import axios from "axios";

// ================== Config API URL ==================
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";

// Lấy BaseURL động, an toàn với dev, LAN, production, SSR
const getBaseURL = () => {
  // ===== Browser =====
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // ===== Dev: localhost / 127.0.0.1 → fetch local backend
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://localhost:${BACKEND_PORT}/api`;
    }

    // ===== Production build: dùng hostname hiện tại (UI-kit.com hoặc LAN khác)
    if (process.env.NODE_ENV === "production") {
      return `http://UI-kit.com/api`;
    }

    // ===== Mobile / LAN khác
    const lanRegex = /^192\.168\.\d+\.\d+$/;
    if (lanRegex.test(hostname)) {
      return `http://${hostname}:${BACKEND_PORT}/api`;
    }

    // ===== Ngrok / host public / staging khác
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
// http.post("/auth/login", { email, password }) → LAN/localhost/prod/Ngrok đều ok
// http.get("/news") → LAN/localhost/prod/Ngrok đều ok
