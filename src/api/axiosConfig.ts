import axios from "axios";

// Lấy hostname hiện tại (PC / LAN / domain)
const hostname = window.location.hostname;

// Lấy port backend từ env, fallback 8000
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "8000";

const API_URL = `http://${hostname}:${BACKEND_PORT}`;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor thêm token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      if (!config.headers) config.headers = {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
