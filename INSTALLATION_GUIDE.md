# Hướng Dẫn Cài Đặt & Triển Khai - Hệ Thống Nhập Điểm Nâng Cao

## 🚀 Bước 1: Cài Đặt Dependencies

Các dependencies đã có sẵn trong project:

- `react-hot-toast` - Thông báo toast
- `@mui/material` - UI components
- `@mui/icons-material` - Icons
- `socket.io-client` - Socket communication
- `axios` - HTTP requests

**Không cần install thêm!**

---

## ⚙️ Bước 2: Kiểm Tra Backend Setup

### 2.1 Kiểm tra `server/server.ts`

File đã có Socket.IO setup:

```typescript
const io = new Server(httpServer, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
});

initSocket(io); // ✅ Đã khởi tạo
```

### 2.2 Kiểm tra `server/Routers/grades/gradeRoutes.ts`

Endpoint mới đã thêm:

- ✅ POST `/api/grades/batch` (lưu điểm)
- ✅ POST `/api/grades/submit-with-notifications` (gửi thông báo)

### 2.3 Kiểm tra `server/models/User.ts`

Field notifications đã thêm:

```typescript
notifications: [
  {
    type: String,
    title: String,
    message: String,
    score: Number,
    subject: String,
    class: String,
    teacher: String,
    report: Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
];
```

---

## 📦 Bước 3: Build & Test

### 3.1 Build Frontend

```bash
npm run build
```

### 3.2 Start Server

```bash
cd server
npm run dev
# hoặc
npm run server
```

### 3.3 Kiểm tra Console

Bạn sẽ thấy:

```
🚀 Backend + Frontend + Socket.IO running at:
   → Local:   http://localhost:8000
   → LAN:     http://192.168.x.x:8000
```

---

## 🧪 Bước 4: Testing Endpoints

### 4.1 Test POST `/api/grades/batch`

```bash
curl -X POST http://localhost:8000/api/grades/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "grades": [
      {
        "studentId": "507f1f77bcf86cd799439011",
        "subjectId": "507f1f77bcf86cd799439012",
        "classId": "507f1f77bcf86cd799439013",
        "score": 8.5
      },
      {
        "studentId": "507f1f77bcf86cd799439014",
        "subjectId": "507f1f77bcf86cd799439012",
        "classId": "507f1f77bcf86cd799439013",
        "score": 7.0
      }
    ]
  }'
```

**Expected Response**:

```json
{
  "success": true,
  "grades": [
    {
      "_id": "...",
      "studentId": "507f1f77bcf86cd799439011",
      "score": 8.5,
      "createdAt": "2025-12-17T10:00:00Z"
    }
  ]
}
```

### 4.2 Test POST `/api/grades/submit-with-notifications`

```bash
curl -X POST http://localhost:8000/api/grades/submit-with-notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "classId": "507f1f77bcf86cd799439013",
    "subjectId": "507f1f77bcf86cd799439012",
    "grades": {
      "507f1f77bcf86cd799439011": 8.5,
      "507f1f77bcf86cd799439014": 7.0
    },
    "sendToStudents": true,
    "sendToAdmin": true,
    "teacherId": "507f1f77bcf86cd799439015"
  }'
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Grades submitted successfully",
  "report": {
    "classCode": "10A1",
    "subjectName": "Toán",
    "teacherName": "Nguyễn Văn A",
    "gradedStudents": [
      {
        "studentId": "ST001",
        "name": "Trần Văn A",
        "score": 8.5
      }
    ],
    "totalStudents": 40,
    "gradesSubmittedAt": "2025-12-17T10:30:00Z"
  },
  "notificationsSent": {
    "toStudents": true,
    "toAdmin": true,
    "studentsNotified": 2,
    "adminsNotified": 1
  }
}
```

---

## 🔌 Bước 5: Socket.IO Testing

### 5.1 Kiểm tra Connection (DevTools)

```javascript
// Mở DevTools → Console
console.log(socket.connected); // true/false

socket.on("connect", () => {
  console.log("✅ Connected to server");
});

socket.on("notification", (data) => {
  console.log("📨 Notification:", data);
});
```

### 5.2 Test Manual Emit

```javascript
// Server-side (node repl hoặc trong route)
const { getIo } = require("./utils/socketio");
const io = getIo();

io.to("user:507f1f77bcf86cd799439011").emit("notification", {
  type: "grade_submitted",
  title: "Điểm được cập nhật",
  message: "Thầy Nguyễn Văn A cập nhật điểm Toán: 8.5/10",
  score: 8.5,
  subject: "Toán",
  class: "10A1",
});
```

---

## 🐛 Troubleshooting

### Issue 1: "Cannot POST /api/grades/submit-with-notifications"

**Nguyên nhân**: Route không được register

**Giải pháp**:

```typescript
// Trong server/Routers/grades/gradeRoutes.ts, kiểm tra:
// 1. Endpoint được định nghĩa đúng
// 2. Router được export: export default router;

// Trong server/server.ts, kiểm tra:
app.use("/api/grades", gradeRoutes); // ✅ Phải có
```

### Issue 2: "Grade lock is active"

**Nguyên nhân**: Giáo viên cố gắng lưu điểm khi khóa

**Giải pháp**:

```typescript
// Frontend: Check gradeLock?.isLocked
// Backend: Grade lock được kiểm tra tự động

// Admin cần mở khóa:
// API: DELETE /api/grades/lock/{classId}/{subjectId}
```

### Issue 3: "Socket.IO not connected"

**Nguyên nhân**: Client không kết nối được server

**Giải pháp**:

```javascript
// Kiểm tra trong browser console:
console.log(socket.connected);

// Nếu false, kiểm tra:
// 1. Server có chạy không?
// 2. Port có đúng không?
// 3. CORS có allow không?

// Trong server/server.ts:
const io = new Server(httpServer, {
  cors: { origin: "*" }, // ✅ Allow all
  transports: ["websocket", "polling"],
});
```

### Issue 4: "Notifications not saved to DB"

**Nguyên nhân**: User.notifications không được update

**Giải pháp**:

```javascript
// Kiểm tra trong gradeRoutes.ts:
await User.findByIdAndUpdate(admin._id, {
  $push: { notifications: notification }, // ✅ Phải có $push
});

// Kiểm tra User model có notifications field
// Kiểm tra MongoDB connection
```

### Issue 5: "Học sinh không nhận thông báo"

**Nguyên nhân**: Socket room không được setup đúng

**Giải pháp**:

```javascript
// Kiểm tra client join room:
socket.on("connect", () => {
  socket.emit("join", `user:${userId}`); // ✅ Phải join room
});

// Kiểm tra server emit:
io.to(`user:${userId}`).emit("notification", data); // ✅ Phải join trước
```

---

## 📊 Verifying Implementation

### Checklist Hoàn Thành

- [ ] **Frontend**
  - [ ] GradeEntryForm.tsx tạo thành công
  - [ ] GradesTab.tsx import GradeEntryForm
  - [ ] TeacherGrades.tsx import GradeEntryForm
  - [ ] Form hiển thị khi mở tab "Quản lý điểm"

- [ ] **Backend - Routes**
  - [ ] gradeRoutes.ts có endpoint `/submit-with-notifications`
  - [ ] Endpoint validate input
  - [ ] Endpoint emit Socket.IO
  - [ ] Endpoint save notifications

- [ ] **Database**
  - [ ] User.ts có notifications field
  - [ ] Notifications save thành công
  - [ ] Read flag hoạt động

- [ ] **Socket.IO**
  - [ ] Server khởi tạo Socket.IO
  - [ ] Client listen "notification" event
  - [ ] Emit tới đúng user (room)

- [ ] **Integration**
  - [ ] Giáo viên chọn lớp → danh sách môn tải
  - [ ] Chọn môn → điểm hiện tại tải
  - [ ] Nhập điểm → validate đúng
  - [ ] Click "Lưu" → lưu DB thành công
  - [ ] Dialog xuất hiện → cấu hình đúng
  - [ ] Click "Gửi" → thông báo gửi
  - [ ] Học sinh nhận thông báo real-time
  - [ ] Admin nhận báo cáo real-time

---

## 🔍 Database Query Testing

### Query 1: Check User Notifications

```javascript
// MongoDB
db.users.findOne({ _id: ObjectId("...") }).notifications;

// Mongoose
await User.findById(userId).select("notifications");
```

### Query 2: Check Grade

```javascript
db.grades.findOne({ studentId: ObjectId("..."), subjectId: ObjectId("...") });
```

### Query 3: Check Grade Lock

```javascript
db.grelocks.findOne({ classId: ObjectId("..."), subjectId: ObjectId("...") });
```

---

## 📈 Performance Optimization

### Caching (Optional - Tương Lai)

```javascript
// Có thể cache danh sách lớp & môn
redis.set(`teacher:${teacherId}:classes`, JSON.stringify(classes), 3600);
```

### Batch Optimization (Đã Implement)

```javascript
// Batch insert thay vì insert từng cái
await Grade.insertMany(grades, { ordered: false });
```

### Index Optimization

```javascript
// Thêm vào User schema
notifications: {
  type: Array,
  index: true  // Index để query nhanh
}
```

---

## 📝 Logging

### Server Logs

Bạn sẽ thấy trong console:

```
📨 Grade notification sent to student ST001
📨 Grade report sent to admin admin@example.com
🔐 Socket 12345 joined room user:507f1f77bcf86cd799439011
```

### Debug Mode

Để enable debug, thêm vào `server/Routers/grades/gradeRoutes.ts`:

```typescript
console.log("📊 Submit request:", {
  classId,
  subjectId,
  gradesCount: Object.keys(gradesData).length,
  sendToStudents,
  sendToAdmin,
});
```

---

## 🎓 Learning Resources

- [Socket.IO Docs](https://socket.io/docs/)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [Express Routing](https://expressjs.com/en/guide/routing.html)
- [React Hooks](https://react.dev/reference/react)

---

## 🔐 Security Checklist

- ✅ JWT token verify
- ✅ Role-based access control
- ✅ Input validation
- ✅ Database constraints
- ✅ CORS configured
- ✅ Error handling

---

## 📞 Support

Nếu gặp vấn đề:

1. **Kiểm tra logs**: `npm run server` và xem console
2. **Browser DevTools**: Kiểm tra Network & Console tabs
3. **MongoDB**: Kiểm tra dữ liệu trong database
4. **Socket.IO**: Kiểm tra connection status

---

**Tài liệu này được cập nhật ngày**: 17 Tháng 12, 2025
