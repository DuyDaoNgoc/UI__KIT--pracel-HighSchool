// src/lib/http.ts
import axios from "axios";

// ===== Utility: Compute baseURL synchronously =====
function computeBaseURL(): string {
  const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";
  const EXPLICIT_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

  if (EXPLICIT_BACKEND_URL) {
    return EXPLICIT_BACKEND_URL.endsWith("/api")
      ? EXPLICIT_BACKEND_URL
      : EXPLICIT_BACKEND_URL.replace(/\/$/, "") + "/api";
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://localhost:${BACKEND_PORT}/api`;
    }

    const lanRegex = /^192\.168\.\d+\.\d+$/;
    if (lanRegex.test(hostname)) {
      return `http://${hostname}:${BACKEND_PORT}/api`;
    }

    return `${window.location.origin.replace(/\/$/, "")}/api`;
  }

  return `http://localhost:${BACKEND_PORT}/api`;
}

const API_URL = computeBaseURL();

// ===== Axios Instance =====
const http = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 15s
});

// ===== Interceptor thêm token =====
http.interceptors.request.use(
  (config) => {
    // Ensure baseURL is always correct
    config.baseURL = computeBaseURL();

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

// ===== Helpers =====
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
