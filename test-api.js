const axios = require("axios");

// ================== Cấu hình ==================
const HOST = "192.168.10.30"; // sửa thành IP đúng hoặc "localhost"
const PORT = 8000;
const BASE_URL = `http://${HOST}:${PORT}/api`;

// ================== Danh sách endpoint test ==================
const endpoints = [
  { method: "get", path: "/news" },
  {
    method: "post",
    path: "/auth/login",
    data: { email: "test@test.com", password: "123456" },
  },
  { method: "get", path: "/grades" },
  { method: "get", path: "/admin/test" },
];

// ================== Test tự động ==================
async function testAll() {
  for (const ep of endpoints) {
    try {
      const res = await axios({
        method: ep.method,
        url: BASE_URL + ep.path,
        data: ep.data || {},
        headers: { "Content-Type": "application/json" },
        timeout: 10000, // 10s timeout
      });
      console.log(
        `✅ ${ep.method.toUpperCase()} ${ep.path} →`,
        res.status,
        res.data
      );
    } catch (err) {
      if (err.response) {
        console.log(
          `❌ ${ep.method.toUpperCase()} ${ep.path} →`,
          err.response.status,
          err.response.data
        );
      } else if (err.code === "ECONNABORTED") {
        console.log(`❌ ${ep.method.toUpperCase()} ${ep.path} → Timeout`);
      } else {
        console.log(`❌ ${ep.method.toUpperCase()} ${ep.path} →`, err.message);
      }
    }
  }
}

testAll();
