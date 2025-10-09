# UI\_\_KIT--pracel-HighSchool

Dự án giao diện web **UI-KIT-pracel** (Parcel + React + Express + MongoDB).
Hướng dẫn này giúp clone, cài đặt và chạy demo / phát triển nhanh trên máy local và cách build production.

---

<img width="706" height="377" alt="image" src="https://github.com/user-attachments/assets/ed36cd42-ec04-46b9-a2d9-1ffe8dfd7c07" />
<img width="706" height="377" alt="image" src="https://github.com/user-attachments/assets/ab7b26d6-6ced-456e-95c1-2dd88e7abb1a" />

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
<img width="284" height="177" alt="cloua" src="https://github.com/user-attachments/assets/d25df88f-eb47-4812-81d9-b9168aa925f9" />

--
## 🚀 Clone & cài đặt nhanh-

# 0. Sao chép đường dẫn về 
<img width="284" height="177" alt="cloua" src="https://github.com/user-attachments/assets/29be8e1d-2be5-4dbe-a01d-19bf40478fba" /></br>
```bash
# 0.1 bật phần mềm git vào mục bất kì
```
<img width="284" height="177" alt="cloua" src="https://github.com/user-attachments/assets/5befa9fc-d3d8-4636-bb30-a8ba01cf34c8" /></br>
# 1. Clone repo từ GitHub
```bash
git clone <đường_dẫn_repo>
```

<b>  dán phải ấn chuột phải </b>
</br>
<img width="284" height="177" alt="cloua" src="https://github.com/user-attachments/assets/05696579-797a-44c0-983d-ddc94d853a14" />
</br>
<b>  và dán xong ấn tải </b>
</br>
<img width="284" height="177" alt="cloua" src="https://github.com/user-attachments/assets/6dec581e-d69f-4efc-b66f-3c73f715e83f" />
</br>
<b>  và khi tải xong nó sẽ như này </b>
</br>
<img width="284" height="177" alt="cloua" src="https://github.com/user-attachments/assets/e46e2522-39fd-48db-8593-5af40e9926ab" />
</br>
<b>2. Vào thư mục dự án </b> 
```bash
cd UI-KIT-pracel
```

<img width="284" height="177" alt="cloua" src="https://github.com/user-attachments/assets/0740e338-ca3e-46cb-ac35-6343738459c4" />

# 3. (Tuỳ chọn) Mở Terminal

<img width="284" height="177" alt="cloua" src="https://github.com/user-attachments/assets/df49c580-bd6a-4094-9d5c-2c10a3f28ea8" />

# 4. Cài dependencies cho phần client (gốc)
```bash
npm install
```

<img width="284" height="177" alt="cloua" src="https://github.com/user-attachments/assets/cd21f548-3fa1-4043-b44b-8cf62fbaf317" />
> Sau bước trên, bạn đã cài xong dependencies cho client và server.

---

## 🔑 Biến môi trường (.env)

Tạo file `.env` trong folder `server/` gộp tất cả nội dung trong **1 bash block**:

```bash
cat > server/.env <<EOL
MONGO_URI=mongodb+srv://pracelJS:duypro0478@duy04.wdkexkx.mongodb.net/?retryWrites=true&w=majority&appName=Duy04
PORT=8000
JWT_SECRET=supersecret
ADMIN_EMAIL=kinbingo18@gmail.com
ADMIN_PASSWORD=duypro0478
EOL
```

---

Những lệnh chính bạn sẽ dùng (theo `package.json` của repo):  

```bash
npm run client      # khởi động frontend bằng Parcel
```

```bash
npm run server      # khởi động backend
```

```bash
npm run build       # build frontend production
```

```bash
npm run clean       # xóa cache / dist
```

```bash
npm run tunnel      # helper Cloudflare tunnel (nếu có)
```

```bash
npm run tunnel:run  # helper Cloudflare tunnel (nếu có)
```

---

## ▶️ Chạy dự án (2 terminal)

**Mở 2 terminal riêng** để chạy client và server — không chạy cả hai trên cùng một port.

### Terminal 1 — Frontend (Parcel)
```bash
npm run client
```


```


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
<img width="706" height="377" alt="image" src="https://github.com/user-attachments/assets/383c001c-f345-413b-9d01-7e56542db43b" />
<br>

## Khi chạy nó sẽ báo:

</br>
<b>CLIENT: THÀNH CÔNG</b></br>
<b>SERVER KHÔNG NHẬN ĐƯỢC DỮ LIỆU TRÊN MONGODB</b>
</br>

<img width="706" height="377" alt="image" src="https://github.com/user-attachments/assets/9cc1e79f-ab8c-46fd-b22a-aefde138d851" />
</br>

## ĐẾN BƯỚC NÀY RỒI SẼ VÀO TRUY CẬP MONGODB ĐỂ SERVER CÓ THỂ NHẬN ĐƯỢC DỮ LIỆU

<ol>
  <li>
    <a href = "https://account.mongodb.com/account/login">Truy cập vào Mongodb và đăng nhập tài khoản đã được cung cấp </a>
  </li>
  </br>
  <img width="1919" height="863" alt="image" src="https://github.com/user-attachments/assets/446009a8-b917-42c2-97e9-e03a481e6d01" />
  </br>
<li>Sau khi đăng nhập thi nó sẽ vào trang</li>
</br>
  <img width="1919" height="896" alt="image" src="https://github.com/user-attachments/assets/0a4c8869-0881-4fd5-87b5-c57e4b715ba0" />
  </br>
  <li>Ấn vào Add Current IP Address để nhận Ip rồi server sẽ đọc ip đó và truy cập thành công  </li>
  </br>
<img width="1920" height="990" alt="image" src="https://github.com/user-attachments/assets/dcbfbfb5-2f0f-4ba3-8cec-c82626af20c7" />
</br>
  </br>
  <li>Sau đó chạy cơ bản thì lên mạng ghi : <a href= "http://localhost:5000/" >localhost:5000 </a> </li>
</ol>

## 🏗 Build production (không bắt buộc vì src và server đã auto build dist)

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
<img width="706" height="377" alt="image" src="https://github.com/user-attachments/assets/ba405aed-43bb-42c7-b2b5-23625d10a8c8" />
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
