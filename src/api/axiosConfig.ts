// src/api/axiosConfig.ts
import axios from "axios";

// ===== Lấy port backend từ env
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";

// ===== Hàm lấy baseURL động
const getBaseURL = async (): Promise<string> => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname === "localhost") {
      return `http://localhost:${BACKEND_PORT}/api`;
    }

    const lanRegex = /^192\.168\.\d+\.\d+$/;
    if (lanRegex.test(hostname)) {
      return `http://${hostname}:${BACKEND_PORT}/api`;
    }

    // Production: lấy LAN IP thật từ server
    if (process.env.NODE_ENV === "production") {
      try {
        const res = await fetch("/socket-url");
        const data = await res.json();
        return `${data.url}/api`; // http://<LAN_IP>:PORT/api
      } catch {
        return `http://localhost:${BACKEND_PORT}/api`; // fallback
      }
    }

    return `${window.location.origin}/api`;
  }

  return (
    process.env.REACT_APP_BACKEND_URL || `http://localhost:${BACKEND_PORT}/api`
  );
};

const API_URL = getBaseURL();

// ===== Axios instance chuẩn
// ===== Axios instance chuẩn với baseURL async
const http = axios.create({
  baseURL: undefined, // sẽ set sau
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Lấy URL động + set baseURL
(async () => {
  http.defaults.baseURL = await getBaseURL();
})();

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
  (error) => Promise.reject(error),
);

// ===== Helpers
export async function get<T>(url: string, config?: any): Promise<T> {
  const res = await http.get<T>(url, config);
  return res.data;
}

export async function post<T, B = any>(
  url: string,
  body: B,
  config?: any,
): Promise<T> {
  const res = await http.post<T>(url, body, config);
  return res.data;
}

export default http;
