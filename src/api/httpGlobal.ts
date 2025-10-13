// src/api/httpGlobal.ts
import axios from "axios";
import type { AxiosRequestConfig } from "@/types/axios";
import { toast } from "react-toastify";
import { getGlobalLoadingSetter } from "../Components/settings/hook/IOserver/loading/LoadingContext";

// ===== Lấy baseURL động =====
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";

const getBaseURL = (): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://localhost:${BACKEND_PORT}/api`;
    }

    const lanRegex = /^192\.168\.\d+\.\d+$/;
    if (lanRegex.test(hostname))
      return `http://${hostname}:${BACKEND_PORT}/api`;

    if (process.env.NODE_ENV === "production") return `https://UI-kit.com/api`;

    return `${window.location.origin}/api`;
  }

  if (process.env.REACT_APP_BACKEND_URL)
    return process.env.REACT_APP_BACKEND_URL;

  return `http://localhost:${BACKEND_PORT}/api`;
};

const API_URL = getBaseURL();

// ===== Axios instance =====
const http = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 15s
});

// ===== Loading setter toàn cục =====
let setLoadingGlobal: ((loading: boolean) => void) | null = null;
if (typeof window !== "undefined") {
  setLoadingGlobal = getGlobalLoadingSetter();
}

// ===== Interceptor request =====
http.interceptors.request.use(
  (config) => {
    setLoadingGlobal?.(true);
    const token = localStorage.getItem("token");
    if (token) {
      if (!config.headers) config.headers = {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    setLoadingGlobal?.(false);
    toast.error("Lỗi khi gửi request!");
    return Promise.reject(error);
  },
);

// ===== Interceptor response =====
http.interceptors.response.use(
  (response) => {
    setLoadingGlobal?.(false);
    return response;
  },
  (error) => {
    setLoadingGlobal?.(false);
    if (!navigator.onLine) toast.error("Không có kết nối mạng!");
    else if (error.response)
      toast.error(error.response.data?.message || "Lỗi server!");
    else toast.error(error.message || "Lỗi không xác định!");
    return Promise.reject(error);
  },
);

// ===== Hàm helper toàn diện =====
async function requestGlobal<T>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T | null> {
  if (!navigator.onLine) {
    toast.error("Không có kết nối mạng!");
    return null;
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Server quá lâu không phản hồi")),
        60000,
      ),
    );

    const axiosPromise =
      method === "get"
        ? http.get<T>(url, config)
        : method === "post"
          ? http.post<T>(url, data, config)
          : method === "put"
            ? http.put<T>(url, data, config)
            : method === "patch"
              ? http.patch<T>(url, data, config)
              : http.delete<T>(url, config);

    const res = await Promise.race([axiosPromise, timeoutPromise]);

    return (res as any).data;
  } catch (err: any) {
    toast.error(err.message || "Lỗi khi xử lý dữ liệu!");
    return null;
  }
}

// ===== Export toàn bộ helper =====
export const httpGlobal = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    requestGlobal<T>("get", url, null, config),
  post: <T, B = any>(url: string, body: B, config?: AxiosRequestConfig) =>
    requestGlobal<T>("post", url, body, config),
  put: <T, B = any>(url: string, body: B, config?: AxiosRequestConfig) =>
    requestGlobal<T>("put", url, body, config),
  patch: <T, B = any>(url: string, body: B, config?: AxiosRequestConfig) =>
    requestGlobal<T>("patch", url, body, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    requestGlobal<T>("delete", url, null, config),
  axiosInstance: http, // nếu cần gọi trực tiếp
};

export default httpGlobal;
