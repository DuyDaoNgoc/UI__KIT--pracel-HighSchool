// src/api/axiosConfig.ts
import axios from "axios";

// ===== Lấy port backend từ env
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";

// ===== Hàm lấy baseURL động
const getBaseURL = (): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    // ===== Dev: localhost / 127.0.0.1
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://localhost:${BACKEND_PORT}/api`;
    }

    // ===== LAN IP
    const lanRegex = /^192\.168\.\d+\.\d+$/;
    if (lanRegex.test(hostname)) {
      return `http://${hostname}:${BACKEND_PORT}/api`;
    }

    // ===== Production
    if (process.env.NODE_ENV === "production") {
      return `https://UI-kit.com/api`;
    }

    // ===== Ngrok / host public / staging khác
    return `${window.location.origin}/api`;
  }

  // ===== Node.js / SSR / test env
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }

  // ===== Fallback mặc định
  return `http://localhost:${BACKEND_PORT}/api`;
};

// ===== Base URL
const API_URL = getBaseURL();

// ===== Axios instance chuẩn
const http = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // 30s timeout
});

// ===== Interceptor tự động thêm token
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

// ===== GET helper
export async function get<T>(url: string, config?: any): Promise<T> {
  const res = await http.get<T>(url, config);
  return res.data;
}

// ===== POST helper
export async function post<T, B = any>(
  url: string,
  body: B,
  config?: any
): Promise<T> {
  const res = await http.post<T>(url, body, config);
  return res.data;
}

export default http;
