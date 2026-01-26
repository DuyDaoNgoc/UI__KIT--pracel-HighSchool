# Quick Troubleshoot Guide - Student Tuition

## ❌ Issue: "Không có dữ liệu" trong Thống kê Học sinh

### ✅ Quick Fixes (Thử lần lượt):

#### 1. Check Admin đã tạo bảng học phí chưa?

```bash
# MongoDB CLI
db.tuitions.find().count()  // Phải > 0
```

#### 2. Check Admin đã nhấn "Tạo cho tất cả học sinh" chưa?

```bash
db.studenttuitions.find().count()  // Phải > 0
```

#### 3. Check StudentTuition có dữ liệu của học sinh này không?

```bash
db.studenttuitions.find({
  studentId: ObjectId("[STUDENT_ID]")
}).count()  // Phải > 0
```

#### 4. Kiểm tra Browser Console (F12)

```
Tìm logs như:
✅ [ProfileStats] Loaded student tuitions: X

Nếu không có → API call có thể thất bại
```

#### 5. Kiểm tra Network Tab (F12 → Network)

```
Tìm request: GET /api/student-tuition/student/[ID]

Nếu:
- Status 200, data: [] → Không có StudentTuition cho HS này
- Status 200, data: [{...}] → ✅ OK, kiểm tra UI render
- Status 404/500 → Backend error
```

#### 6. Kiểm tra user.\_id được truyền đúng

```javascript
// ProfileStatistics.tsx line 53
console.log("DEBUG studentId:", studentId); // Check F12 console
```

---

## ❌ Issue: Admin tạo bảng học phí nhưng không thấy học sinh

### ✅ Quick Fixes:

#### 1. Check lớp có học sinh không?

```bash
db.classes.findOne({ _id: ObjectId("[CLASS_ID]") })
// Xem field studentIds - phải có phần tử
```

#### 2. Check StudentTuition được tạo không?

```bash
db.studenttuitions.find({
  tuitionId: ObjectId("[TUITION_ID]")
}).count()  // Phải > 0
```

#### 3. Kiểm tra Browser Console

```
Tìm logs:
✅ [TuitionTab] Loaded student tuitions: X

Nếu không thấy → click expand để trigger fetch
```

#### 4. Kiểm tra Network Tab

```
GET /api/tuitions/[ID]/students

Nếu:
- data: [] → Không có StudentTuition cho bảng học phí này
- data: [{...}] → ✅ OK, kiểm tra UI render
```

#### 5. Reload page (Ctrl + R)

Có thể socket event không được emit, reload sẽ fetch fresh data

---

## 🔍 Debug Flow

```
Admin tạo bảng học phí
    ↓
Admin nhấn "Tạo cho tất cả học sinh"
    ↓ (Check Console)
✅ Generating... / ❌ Error?
    ↓
Backend emit socket event
    ↓
TuitionTab reload dữ liệu
    ↓ (Check Console)
✅ Loaded X records / ❌ No records
    ↓
Nhấn expand để xem danh sách
    ↓ (Check Network)
GET /api/tuitions/[ID]/students
    ↓
Danh sách học sinh hiển thị
```

---

## 📊 Student View Flow

```
Student xem Profile
    ↓
Tab "Thống kê" hiển thị
    ↓ (Check Console)
🔍 Fetching tuitions...
    ↓
GET /api/student-tuition/student/[ID]
    ↓ (Check Network)
Status 200, data: [{...}]
    ↓
✅ Loaded X records
    ↓
Chart học phí hiển thị dữ liệu
    - Tổng nợ
    - Đã đóng
    - Còn nợ
```

---

## 🔧 Common Console Errors & Fixes

### Error: "401 Unauthorized"

```
❌ Cause: Token hết hạn
✅ Fix: Logout → Login lại
```

### Error: "404 Not Found"

```
❌ Cause: API endpoint không tồn tại hoặc ID sai
✅ Fix: Kiểm tra URL và ID có đúng không
```

### Error: "500 Server Error"

```
❌ Cause: Server error
✅ Fix:
1. Kiểm tra server logs
2. Restart server
3. Check database connection
```

### Error: "Network Error"

```
❌ Cause: Server không chạy hoặc URL sai
✅ Fix:
1. npm run dev (frontend)
2. npm run start (backend)
3. Kiểm tra BASE_URL trong axiosConfig
```

---

## 📋 Verification Checklist

```
[ ] Server running: http://localhost:3001/api
[ ] Frontend running: http://localhost:5173
[ ] MongoDB connected
[ ] Admin user logged in
[ ] Classes có học sinh
[ ] Tuition được tạo
[ ] StudentTuition được tạo
[ ] Browser console không có error
[ ] Network requests trả về 200
[ ] Data hiển thị trong UI
```

---

## 🚀 Force Refresh

Nếu mọi thứ cấu hình đúng nhưng vẫn không hiển thị:

```javascript
// Browser Console (F12)
// 1. Clear localStorage
localStorage.clear();

// 2. Reload page
window.location.reload();

// 3. Check logs
// Xem có "✅ Loaded X records" không
```

---

## 📞 Support

Nếu sau các bước trên vẫn không hoạt động, cung cấp:

1. **Console logs** (F12 → Console → copy paste)
2. **Network response** (F12 → Network → click request → Response)
3. **Error message** (nếu có)
4. **DB query result** (check MongoDB)

Sau đó check file `STUDENT_TUITION_DEBUGGING.md` để debug chi tiết.
