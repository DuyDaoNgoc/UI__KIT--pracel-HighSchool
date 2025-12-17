import axios from "axios";

// ===== Lấy port backend từ env
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";
const EXPLICIT_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// ===== Hàm tính baseURL một cách đồng bộ (loại bỏ race condition)
function computeBaseURL(): string {
  // Nếu dev override được cung cấp, ưu tiên nó
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

    // Nếu là môi trường production trên cùng domain, dùng origin
    return `${window.location.origin.replace(/\/$/, "")}/api`;
  }

  // Fallback
  return `http://localhost:${BACKEND_PORT}/api`;
}

// ===== Tạo instance với baseURL đã xác định ngay lập tức
const resolvedBaseURL = computeBaseURL();

const http = axios.create({
  baseURL: resolvedBaseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ===== Interceptor thêm token
http.interceptors.request.use(
  (config) => {
    // đảm bảo baseURL luôn đúng
    if (resolvedBaseURL) {
      config.baseURL = resolvedBaseURL;
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        if (!config.headers) config.headers = {};
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }

    try {
      const url = (config.baseURL || "") + (config.url || "");
      console.log("📤 Request URL:", url);
    } catch (e) {
      // ignore
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
