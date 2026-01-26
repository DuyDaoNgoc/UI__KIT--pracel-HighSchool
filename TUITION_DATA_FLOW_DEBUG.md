# Tuition Data Flow Debug Guide

## 🔍 Problem: Student không nhận được dữ liệu học phí

### Current Flow:

1. **Admin tạo tuition plan** → `/tuitions` (POST)
2. **Admin generate cho lớp** → `/tuitions/:tuitionId/generate-for-students` (POST)
3. **StudentTuition records được tạo**
4. **Student xem thống kê** → `/student-tuition/student/:studentId` (GET)
5. **Dữ liệu không hiển thị** ❌

---

## 🐛 Debug Steps

### Step 1: Check Backend Logs khi Generate

Khi admin nhấn "Tạo bảng học phí", server sẽ log:

```
📝 [Tuition] Generating student tuitions for tuition plan: [tuitionId]
✅ [Tuition] Found tuition: { id, classId, totalAmount }
✅ [Tuition] Found class: { id, code, studentCount }
📋 [Tuition] Student IDs to process: [count] [ids array]
✅ [Tuition] Created StudentTuition record: { id, studentId, tuitionId }
✅ [Tuition] Generated X new student tuition records
```

**Kiểm tra:**

- Có lấy đúng class không?
- Có tìm thấy students không? (studentCount > 0?)
- Có tạo StudentTuition records không? (Created X records)

---

### Step 2: Check Frontend Logs khi Student Xem

Browser console khi học sinh xem trang thống kê:

```
🔍 [ProfileStats] Fetching tuitions for studentId: [id]
📦 [ProfileStats] API Response received: { data: [...] }
✅ [ProfileStats] Loaded student tuitions: X
📋 [ProfileStats] Data details: [...]
```

**Kiểm tra:**

- Có fetch được không? (studentId in logs?)
- API response có data không?
- Loaded bao nhiêu records?

---

### Step 3: Kiểm tra MongoDB

```javascript
// Check StudentTuition records
db.studenttuitions.find({ studentId: ObjectId("...") }).pretty();

// Check có records không?
db.studenttuitions.countDocuments({ studentId: ObjectId("...") });
```

---

## 🔧 Possible Issues & Solutions

### Issue 1: Lớp không có học sinh

**Logs:** `studentCount: 0`

```bash
✅ [Tuition] Found class: { studentCount: 0 }
⚠️ [Tuition] No students found in this class
```

**Solution:** Thêm học sinh vào lớp trước khi generate

---

### Issue 2: StudentTuition tạo nhưng không lấy được

**Logs:** `Created X records` nhưng `Loaded 0 tuitions`

```bash
# Backend: Tạo thành công
✅ [Tuition] Created StudentTuition record: { ... }

# Frontend: Không lấy được
✅ [ProfileStats] Loaded student tuitions: 0
```

**Nguyên nhân:** StudentId không match
**Solution:**

- Kiểm tra studentId format
- Ensure studentId là string ObjectId
- Check MongoDB logs

---

### Issue 3: API endpoint lỗi

**Logs:** `❌ [ProfileStats] Fetch student tuitions error:`

```bash
GET /student-tuition/student/[studentId]
response: 500
message: "Server error"
```

**Solution:**

- Kiểm tra server logs
- Ensure endpoint syntax đúng
- Check token authentication

---

## 🚀 Quick Test

### Test 1: Create & Fetch via curl

```bash
# 1. Create tuition
curl -X POST http://localhost:3000/api/tuitions \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"classId": "...", "semester": 1, "subjectIds": ["..."]}'

# 2. Generate for students
curl -X POST http://localhost:3000/api/tuitions/[tuitionId]/generate-for-students \
  -H "Authorization: Bearer [token]"

# 3. Check student data
curl http://localhost:3000/api/student-tuition/student/[studentId] \
  -H "Authorization: Bearer [token]"
```

---

## 📋 Checklist

- [ ] Backend logs show `studentCount > 0`?
- [ ] Backend logs show `Created X records`?
- [ ] Frontend logs show `Loaded X tuitions`?
- [ ] MongoDB has StudentTuition records?
- [ ] StudentId format matches (MongoDB ObjectId)?
- [ ] Student token is valid?
- [ ] No 500 errors in API response?

---

## 🔍 Real-time Monitoring

### Server Terminal:

```bash
# Start server with logs
npm run dev

# Look for these patterns:
# ✅ = Success
# ⚠️ = Warning (not critical)
# ❌ = Error (problem)
# 📝 📦 📋 = Info logs
```

### Browser Console (F12):

```javascript
// All logs start with:
// [ProfileStats] or [ProfileTuition] = Frontend logs
// 🔍 🔄 📦 ✅ ❌ = Status indicators
```

---

## 📞 If Still Not Working

1. **Check server logs** for generate-for-students
2. **Check browser console** for fetch errors
3. **Check MongoDB** for actual records
4. **Check studentId** format and validity
5. **Restart server** and clear browser cache
