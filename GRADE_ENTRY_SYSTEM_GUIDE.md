# Hệ Thống Nhập Điểm Nâng Cao cho Giáo Viên - Tài Liệu Hướng Dẫn

## Tổng Quan

Hệ thống nhập điểm nâng cao cho phép giáo viên:

1. **Chọn lớp dạy** từ danh sách các lớp được giao phó
2. **Chọn môn học** trong lớp đó
3. **Nhập điểm hàng loạt** cho tất cả học sinh
4. **Gửi thông báo** cho học sinh và admin về điểm vừa được cập nhật
5. **Lưu trữ điểm** trong hệ thống với khóa điểm cho tính toàn vẹn dữ liệu

---

## Kiến Trúc Hệ Thống

### Frontend Components

#### 1. **GradeEntryForm.tsx** (Thành phần chính)

- **Đường dẫn**: `src/pages/Profile/teacher/GradeEntryForm.tsx`
- **Chức năng**:
  - Hiển thị form chọn lớp và môn học
  - Bảng nhập điểm học sinh
  - Nút lưu và gửi điểm
  - Dialog xác nhận gửi thông báo

**Luồng hoạt động:**

```
1. Giáo viên đăng nhập → Mở tab "Quản lý điểm"
2. Chọn lớp dạy → Hệ thống tải danh sách học sinh
3. Chọn môn học → Tải điểm hiện tại (nếu có)
4. Nhập/Chỉnh sửa điểm → Kiểm tra điểm (0-10)
5. Click "Lưu Điểm" → Lưu vào database
6. Dialog xuất hiện → Chọn gửi cho học sinh/admin
7. Click "Gửi Điểm" → Gửi thông báo qua Socket.IO
```

#### 2. **GradesTab.tsx** (Wrapper)

- Wrapper component bao gọi `GradeEntryForm`
- Dùng cho backward compatibility

#### 3. **TeacherGrades.tsx** (Wrapper)

- Component cũ, hiện được sử dụng lại để gọi `GradeEntryForm`

---

### Backend APIs

#### 1. **POST** `/api/grades/batch` (Lưu điểm)

```typescript
Request Body:
{
  "grades": [
    {
      "studentId": "507f1f77bcf86cd799439011",
      "subjectId": "507f1f77bcf86cd799439012",
      "classId": "507f1f77bcf86cd799439013",
      "score": 8.5
    }
  ]
}

Response:
{
  "success": true,
  "grades": [ /* mảng điểm đã lưu */ ]
}
```

**Công việc:**

- Kiểm tra khóa điểm
- Validate điểm (0-10)
- Upsert records
- Đồng bộ điểm về User collection

---

#### 2. **POST** `/api/grades/submit-with-notifications` (Gửi thông báo)

```typescript
Request Body:
{
  "classId": "507f1f77bcf86cd799439011",
  "subjectId": "507f1f77bcf86cd799439012",
  "grades": {
    "studentId1": 8.5,
    "studentId2": 7.0
  },
  "sendToStudents": true,
  "sendToAdmin": true,
  "teacherId": "507f1f77bcf86cd799439013"
}

Response:
{
  "success": true,
  "message": "Grades submitted successfully",
  "report": {
    "classCode": "10A1",
    "subjectName": "Toán",
    "teacherName": "Nguyễn Văn A",
    "gradedStudents": [ /* danh sách học sinh */ ],
    "totalStudents": 40,
    "gradesSubmittedAt": "2025-12-17T10:30:00Z"
  },
  "notificationsSent": {
    "toStudents": true,
    "toAdmin": true,
    "studentsNotified": 35,
    "adminsNotified": 2
  }
}
```

**Công việc:**

- Tạo báo cáo điểm
- Gửi thông báo qua Socket.IO tới học sinh
- Gửi báo cáo tới tất cả admin
- Lưu thông báo vào database (User.notifications)

---

### Socket.IO Events

#### Nhận Thông Báo

```javascript
// Client-side listener
socket.on("notification", (notification) => {
  // notification.type: "grade_submitted" | "grade_report_submitted"
  // notification.title: Tiêu đề thông báo
  // notification.message: Nội dung thông báo
  // notification.score: Điểm (nếu là grade_submitted)
  // notification.report: Báo cáo (nếu là grade_report_submitted)
});
```

#### Phát Thông Báo (Server)

```javascript
// Gửi tới một học sinh cụ thể
io.to(`user:${studentUserId}`).emit("notification", notification);

// Gửi tới tất cả admin
io.emit("notification", adminNotification);
```

---

## Database Schema

### User.notifications

```typescript
{
  type: string,           // "grade_submitted" | "grade_report_submitted"
  title: string,
  message: string,
  score?: number,         // Điểm của học sinh (nếu grade_submitted)
  subject?: string,       // Tên môn học
  class?: string,         // Mã lớp
  teacher?: string,       // Tên giáo viên
  report?: object,        // Báo cáo chi tiết (nếu grade_report_submitted)
  timestamp: date,
  read: boolean           // Đã xem hay chưa
}
```

---

## Quy Trình Chi Tiết

### 1. Giáo viên lưu điểm

```
Step 1: Giáo viên chọn lớp
  → API GET /classes → Tải danh sách lớp

Step 2: Giáo viên chọn môn
  → API GET /api/subjects/class/{classId} → Tải danh sách môn
  → API GET /api/grades?subjectId={id}&classId={id} → Tải điểm hiện tại
  → API GET /api/grades/lock/status/{classId}/{subjectId} → Kiểm tra khóa

Step 3: Giáo viên nhập điểm
  → Frontend validate (0-10)
  → Hiển thị lên bảng

Step 4: Giáo viên click "Lưu Điểm"
  → POST /api/grades/batch
  → Backend: Lưu tất cả điểm
  → Backend: Đồng bộ điểm về User collection
  → Backend: Phát sự kiện Socket.IO "grade:updated"
  → Frontend: Toast thành công
  → Dialog xuất hiện
```

### 2. Giáo viên gửi thông báo

```
Step 1: Dialog xuất hiện
  → Checkbox "Gửi đến học sinh"
  → Checkbox "Gửi báo cáo đến Admin"

Step 2: Giáo viên chọn và click "Gửi Điểm"
  → POST /api/grades/submit-with-notifications

Step 3: Backend xử lý
  3a. Nếu sendToStudents = true:
    - Fetch tất cả học sinh trong lớp
    - Tạo thông báo cho từng học sinh
    - Phát qua Socket.IO: io.to(`user:${studentUserId}`).emit("notification", ...)
    - Lưu vào User.notifications

  3b. Nếu sendToAdmin = true:
    - Fetch tất cả admin
    - Tạo báo cáo chi tiết
    - Phát qua Socket.IO tới tất cả admin
    - Lưu vào User.notifications

Step 4: Frontend nhận response
  → Toast "Điểm đã được gửi thành công!"
  → Close dialog
```

### 3. Học sinh & Admin nhận thông báo

```
Frontend (Real-time):
  socket.on("notification", (notification) => {
    // Hiển thị toast hoặc đưa vào notification center
    // Cập nhật badge count
  })

Backend (Persistent):
  - Thông báo đã lưu trong User.notifications
  - Khi user refresh page, có thể fetch từ DB
  - Có thể mark as read sau
```

---

## Tính Năng Bảo Vệ

### 1. Khóa Điểm (Grade Lock)

```
- Admin có thể khóa điểm của một môn trong một lớp
- Giáo viên không thể chỉnh sửa khi khóa
- Kiểm tra ở 2 nơi:
  1. Frontend: Disable input fields
  2. Backend: Reject POST request
```

### 2. Validate Điểm

```
- Frontend: 0 ≤ score ≤ 10 (step 0.5)
- Backend: 0 ≤ score ≤ 10 (reject nếu lỗi)
```

### 3. Quyền Truy Cập

```
- Chỉ teacher & admin mới có quyền POST /api/grades/batch
- Chỉ teacher & admin mới có quyền POST /api/grades/submit-with-notifications
```

---

## Hướng Dẫn Sử Dụng

### Cho Giáo Viên

1. **Đăng nhập** vào hệ thống
2. **Mở hồ sơ** → Tab **"Quản lý điểm"**
3. **Chọn lớp dạy** từ dropdown
4. **Chọn môn học** từ dropdown
5. **Nhập điểm** cho từng học sinh (0-10)
6. **Click "💾 Lưu Điểm"** để lưu vào database
7. **Dialog xuất hiện** → Chọn gửi cho ai (học sinh/admin)
8. **Click "✅ Gửi Điểm"** để gửi thông báo

### Cho Học Sinh

- Nhận **thông báo real-time** khi giáo viên cập nhật điểm
- Thông báo chứa: môn học, điểm, tên giáo viên, tên lớp
- Có thể xem lịch sử thông báo trong Notification Center

### Cho Admin

- Nhận **báo cáo chi tiết** khi giáo viên gửi điểm
- Báo cáo chứa: danh sách học sinh, điểm từng em, tên giáo viên, số lượng
- Có thể theo dõi tiến độ nhập điểm các giáo viên
- Có thể khóa điểm khi hết hạn

---

## Troubleshooting

| Vấn đề                | Nguyên nhân                 | Giải pháp                           |
| --------------------- | --------------------------- | ----------------------------------- |
| Không thấy lớp dạy    | Giáo viên chưa được gán lớp | Admin gán lớp cho giáo viên         |
| Input fields disabled | Điểm bị khóa bởi admin      | Admin mở khóa hoặc liên hệ admin    |
| Điểm không lưu được   | Lỗi validate (<0 hoặc >10)  | Nhập điểm trong khoảng 0-10         |
| Thông báo không gửi   | Socket.IO disconnected      | Kiểm tra connection, reload page    |
| Không thấy môn học    | Giáo viên không dạy môn này | Admin cấu hình lại Subject Teachers |

---

## Testing

### Frontend Testing

```bash
# Test UI
1. Mở Developer Tools → Console
2. Mở tab "Quản lý điểm"
3. Kiểm tra:
   - Danh sách lớp tải đúng
   - Danh sách môn tải đúng
   - Form validate đúng
   - Dialog xuất hiện đúng
```

### Backend Testing

```bash
# Test API
curl -X POST http://localhost:8000/api/grades/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "grades": [
      {
        "studentId": "507f1f77bcf86cd799439011",
        "subjectId": "507f1f77bcf86cd799439012",
        "classId": "507f1f77bcf86cd799439013",
        "score": 8.5
      }
    ]
  }'
```

---

## Cải Thiện Tương Lai

- [ ] Excel import/export điểm
- [ ] Thống kê chi tiết điểm từng môn/lớp
- [ ] Email notification cho phụ huynh
- [ ] SMS notification cho khẩn cấp
- [ ] Audit log để kiểm tra ai thay đổi điểm
- [ ] Backup tự động điểm định kỳ
- [ ] Analytics dashboard cho admin

---

## Liên Hệ & Hỗ Trợ

Nếu có vấn đề hoặc đề xuất, vui lòng liên hệ:

- Admin: [Admin Email]
- Developer: [Developer Email]
