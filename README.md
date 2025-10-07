# UI\_\_KIT--pracel-HighSchool

Dự án giao diện web **UI-KIT-pracel** (Parcel + React + Express + MongoDB).
Hướng dẫn này giúp clone, cài đặt và chạy demo / phát triển nhanh trên máy local và cách build production.

---

<img width="706" height="377" alt="image" src="https://github.com/user-attachments/assets/ed36cd42-ec04-46b9-a2d9-1ffe8dfd7c07" />

## 📑 Mục lục

- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Clone & cài đặt nhanh](#clone--cài-đặt-nhanh)
- [Biến môi trường (.env)](#biến-môi-trường-env)
- [Scripts (lệnh thường dùng)](#scripts-lệnh-thường-dùng)
- [Chạy dự án (2 terminal)](#chạy-dự-án-2-terminal)
- [Build production](#build-production)
- [Cấu trúc thư mục mẫu](#cấu-trúc-thư-mục-mẫu)
- [Các dependency chính](#các-dependency-chính)
- [Tunnel (Cloudflare) — tuỳ chọn test ngoài mạng local](#tunnel-cloudflare--tuỳ-chọn-test-ngoài-mạng-local)
- [Troubleshooting & tips](#troubleshooting--tips)
- [Góp ý / đóng góp](#góp-ý--đóng-góp)
- [License](#license)

---

## 💻 Yêu cầu hệ thống

- Node.js v18+ (khuyến nghị)
- npm v9+
- Git
- MongoDB (local) hoặc MongoDB Atlas (connection string dùng trong `.env`)
- (Tuỳ chọn) `cloudflared` nếu muốn expose server ra internet

---

## 🚀 Clone & cài đặt nhanh

````bash
# 1. Clone repo từ GitHub
git clone <đường_dẫn_repo>

# 2. Vào thư mục dự án
cd UI-KIT-pracel

# 3. (Tuỳ chọn) Mở VS Code
code .

# 4. Cài dependencies cho phần client (gốc)
npm install

> Sau bước trên, bạn đã cài xong dependencies cho client và server.

---
## 🔑 Biến môi trường (.env)
trong folder server:

MONGO_URI=mongodb+srv://pracelJS:duypro0478@duy04.wdkexkx.mongodb.net/?retryWrites=true&w=majority&appName=Duy04
PORT=8000
// c:\Users\Admin\Documents\UI-KIT-pracel\.env
JWT_SECRET=supersecret
ADMIN_EMAIL=kinbingo18@gmail.com
ADMIN_PASSWORD=duypro0478



Những lệnh chính bạn sẽ dùng (theo `package.json`  của repo):

* `npm run client` — khởi động frontend bằng Parcel (theo cấu hình script).
* `npm run server` — khởi động backend (script có thể `cd server && ts-node-dev index.ts` hoặc tương tự).
* `npm run build` — build frontend production (output `dist/`).
* `npm run clean` — xóa cache / dist (ví dụ dùng `rimraf`).
* `npm run tunnel` / `npm run tunnel:run` — helper cho Cloudflare tunnel (nếu repo có cấu hình).

>

## ▶️ Chạy dự án (2 terminal)

**Mở 2 terminal riêng** để chạy client và server — không chạy cả hai trên cùng một port.

### Terminal 1 — Frontend (Parcel)

```bash
# Từ thư mục gốc UI-KIT-pracel
npm run client
````

- Parcel sẽ khởi chạy frontend theo cấu hình trong `package.json` (script `client`).
- Theo cấu hình repo, client mặc định được cấu hình chạy trên `http://localhost:5000`
  (bạn phải tự ghi http://localhost:5000 lên trang web nhé)

### Terminal 2 — Backend (Express / TypeScript)

cd server
npm run server

````

* Server sẽ lắng nghe port theo biến `PORT` trong `.env` (ví dụ `5001`).
* Nếu cần gọi API từ client tới server, hãy cấu hình proxy hoặc gọi thẳng tới `http://localhost:5001/api` (hoặc endpoint server của bạn).

---

## 🏗 Build production

```bash
npm run build
````

- Parcel sẽ build frontend vào thư mục `dist/`.
- Deploy `dist/` cùng backend lên môi trường hosting hoặc VPS.

---

## 📂 Cấu trúc thư mục

```
UI-KIT-pracel/
public/            # static assets
├─               # build output
src/               # frontend source (React)
├─
├─ dist/
server/            # backend (Express + TS hoặc JS)
│  ├─ controllers/
   ├─ dist/
│  ├─ models/
│  ├─ routes/
│  └─ index.ts
├─ package.json
└─ README.md
```

---

## 📦 Các dependency chính (tóm tắt)

**Frontend:** react, react-dom, react-router-dom, parcel, aos, framer-motion, sass, axios, lucide-react, react-icons

**Backend:** express, mongoose, mongodb, multer, cors, compression, helmet, jsonwebtoken, bcrypt

**Dev:** typescript, ts-node-dev, concurrently (nếu bạn muốn chạy nhiều script cùng lúc), rimraf

---

## Terminal 3 (không bắt buộc bật nếu ko cần xài cloud)

## 🌐 Tunnel (Cloudflare) — tuỳ chọn

Nếu bạn muốn expose server ra internet cho demo nhanh:

```bash
# ví dụ command (cần cài cloudflared và cấu hình)
npm run tunnel
# hoặc
npm run tunnel:run
```

## Bật CMD (administrator)

khi dùng cloudflared thì phải bật thêm cái
cmd từ bên ngoài và (bẳt buộc cmd với quyền administrator)
khi bật lên thì chạy lệnh: </br>
<b> C:\cloudflared\cloudflared.exe tunnel --url http://localhost:8000 </b>
</br>
(nếu đã build vào Variables mới xài đc)

## Còn cách khác để dùng cloud chỉ với 2 terminal
## ĐÂY LÀ TERMIANL TRONG SERVER 
<img width="422" height="216" alt="image" src="https://github.com/user-attachments/assets/4883a459-5be6-4688-85d3-55c8778bb0e1" /> </br>
<ul>
  <li>Khi build trong server sẽ có 2 đường dẫn chính được tạo ngầu nhiên đó là :</li>
     <li>   → Local:   http://localhost:8000</li>
     <li> → LAN:     http://192.168.10.28:5000 </li>  
</ul>
<li> Local: Cục bộ: Chỉ sự tác động hoặc phạm vi hẹp, không lan rộng ra bên ngoài. </li>
<li>LAN: là mạng cục bộ, là một hệ thống mạng nội bộ cho phép các thiết bị như máy tính, máy in kết nối và chia sẻ tài nguyên, dữ liệu trong một phạm vi địa lý giới hạn như nhà riêng, văn phòng hoặc trường học </li>
<li><b>Khi build xong chọn mạng lan để chia sẻ đường link của lan đó nhưng với điều kiện là các máy được chia sẽ bắt buộc phải cùng Wifi với máy chủ đã chia sẻ</b></li>
