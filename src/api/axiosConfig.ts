// src/api/axiosConfig.ts
import axios from "axios";

const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";

// Lấy BaseURL động, an toàn với dev, LAN, production, SSR
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // ===== Dev trên máy: localhost/127.0.0.1
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      // Trả về localhost để dev máy chính gọi
      return `http://localhost:${BACKEND_PORT}/api`;
    }

    // ===== Mobile / máy khác trong cùng mạng (LAN)
    // Nếu hostname là IP LAN, trả về IP đó
    const lanRegex = /^192\.168\.\d+\.\d+$/;
    if (lanRegex.test(hostname)) {
      return `http://${hostname}:${BACKEND_PORT}/api`;
    }

    // ===== Production
    if (process.env.NODE_ENV === "production") {
      return `http://UI-kit.com/api`;
    }

    // ===== LAN khác / staging
    return `http://${hostname}:${BACKEND_PORT}/api`;
  }

  // ===== Node.js / SSR / test env
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
  timeout: 30000,
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
