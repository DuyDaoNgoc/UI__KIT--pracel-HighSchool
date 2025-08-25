import axios from "axios";

export const http = axios.create({
  baseURL: "http://localhost:8000/api", // khớp backend của bạn
  headers: { "Content-Type": "application/json" },
});
