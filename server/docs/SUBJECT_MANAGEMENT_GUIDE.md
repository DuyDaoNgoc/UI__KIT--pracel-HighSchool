/\*\*

- ============================================
- FRONTEND IMPLEMENTATION GUIDE
- Subject Management UI (Quản Lý Môn Học)
- ============================================
-
- Updated: 2025-12-11
-
- This guide explains how to update the Subject Management UI
- to reflect the new global subjects workflow (no class selection).
  \*/

// ============================================
// 1️⃣ SUBJECT MANAGEMENT - CREATE FORM
// ============================================

/\*\*

- OLD UI (tình trạng cũ):
- ┌─────────────────────────────┐
- │ Thêm Môn Học │
- ├─────────────────────────────┤
- │ Tên Môn: [___________] │
- │ Giá Tiền: [___________] │
- │ Chọn Lớp: [Dropdown ▼] │ ❌ BỎ PHẦN NÀY
- │ [Lớp 10A1 ]│
- │ [Lớp 10A2 ]│
- │ [...] │
- ├─────────────────────────────┤
- │ [Hủy] [Thêm Môn Học] │
- └─────────────────────────────┘
-
- NEW UI (chỉ lấy tên + giá):
- ┌─────────────────────────────┐
- │ Thêm Môn Học (Global) │
- ├─────────────────────────────┤
- │ Tên Môn: [___________] │
- │ Giá Tiền: [___________] │
- │ (Môn học dùng │
- │ chung cho tất │
- │ cả lớp) │
- ├─────────────────────────────┤
- │ [Hủy] [Thêm Môn Học] │
- └─────────────────────────────┘
  \*/

// ============================================
// 2️⃣ API PAYLOAD - CREATE SUBJECT
// ============================================

/\*\*

- Endpoint: POST /api/subjects
-
- Request Body:
  \*/
  const createSubjectPayload = {
  name: "Tiếng Anh", // Required: subject name
  price: 500000 // Required: tuition price
  };

/\*\*

- Response (201 Created):
  \*/
  const createSubjectResponse = {
  message: "Subject created",
  subject: {
  \_id: "675d4e8a1234567890abcdef",
  name: "Tiếng Anh",
  price: 500000,
  // classId không có (hoặc null) = môn học global
  createdAt: "2025-12-11T10:00:00.000Z",
  updatedAt: "2025-12-11T10:00:00.000Z"
  }
  };

// ============================================
// 3️⃣ LIST ALL GLOBAL SUBJECTS
// ============================================

/\*\*

- Endpoint: GET /api/subjects
-
- Returns all global subjects (no class filtering)
-
- Response (200):
  \*/
  const listSubjectsResponse = {
  data: [
  {
  _id: "675d4e8a...",
  name: "Tiếng Anh",
  price: 500000,
  createdAt: "2025-12-11T10:00:00.000Z"
  },
  {
  _id: "675d4e8b...",
  name: "Toán Học",
  price: 450000,
  createdAt: "2025-12-11T10:05:00.000Z"
  },
  {
  _id: "675d4e8c...",
  name: "Lịch Sử",
  price: 350000,
  createdAt: "2025-12-11T10:10:00.000Z"
  }
  // ... more subjects
  ]
  };

// ============================================
// 4️⃣ SUBJECT MANAGEMENT LIST VIEW
// ============================================

/\*\*

- Display all subjects in a table or list
-
- Columns:
- - Tên Môn (Name)
- - Giá Tiền (Price)
- - Số Lớp Dùng (Optional: count how many classes use this subject)
- - Thao Tác (Actions: Edit, Delete)
-
- Example Table:
-
- │ STT │ Tên Môn │ Giá Tiền │ Thao Tác │
- ├─────┼──────────────┼────────────┼───────────────┤
- │ 1 │ Tiếng Anh │ 500,000 │ [Sửa] [Xóa] │
- │ 2 │ Toán Học │ 450,000 │ [Sửa] [Xóa] │
- │ 3 │ Lịch Sử │ 350,000 │ [Sửa] [Xóa] │
- │ 4 │ Địa Lý │ 350,000 │ [Sửa] [Xóa] │
- │ 5 │ Vật Lý │ 480,000 │ [Sửa] [Xóa] │
- │ 6 │ Hóa Học │ 480,000 │ [Sửa] [Xóa] │
  \*/

// ============================================
// 5️⃣ EDIT SUBJECT FORM
// ============================================

/\*\*

- Endpoint: PATCH /api/subjects/{subjectId}
-
- Request Body:
  \*/
  const updateSubjectPayload = {
  name: "Tiếng Anh Nâng Cao",
  price: 550000
  };

/\*\*

- Response (200):
  \*/
  const updateSubjectResponse = {
  message: "Subject updated",
  subject: {
  \_id: "675d4e8a...",
  name: "Tiếng Anh Nâng Cao",
  price: 550000,
  updatedAt: "2025-12-11T11:00:00.000Z"
  }
  };

// ============================================
// 6️⃣ DELETE SUBJECT
// ============================================

/\*\*

- Endpoint: DELETE /api/subjects/{subjectId}
-
- ⚠️ WARNING: Deleting a subject will:
- - Remove it from all class.subjectTeachers assignments
- - Remove it from any timetables that reference it
- - Remove it from grade records
-
- Response (200):
  \*/
  const deleteSubjectResponse = {
  message: "Subject deleted"
  };

// ============================================
// 7️⃣ ASSIGN SUBJECT TO CLASS
// ============================================

/\*\*

- Now that subjects are global, you need a SEPARATE UI to:
- "Assign Subjects to Classes"
-
- This can be done either:
- 1.  In the Class Management page (add a "Subjects & Teachers" tab)
- 2.  In a dedicated "Subject Assignment" page
- 3.  During Timetable creation (assign + schedule in one flow)
-
- Recommended Approach:
- ┌──────────────────────────────────────┐
- │ Quản Lý Lớp → Chọn Lớp → Tab "Môn Học" │
- └──────────────────────────────────────┘
-
- In this tab:
- - Show all global subjects
- - Show assigned subjects (with teachers)
- - Add button: "Gán Môn Học"
-
- Dialog: Gán Môn Học cho Lớp
- ┌─────────────────────────────────────┐
- │ Gán Môn Học cho Lớp 10A1 │
- ├─────────────────────────────────────┤
- │ Chọn Môn Học: [Dropdown ▼] │
- │ [Tiếng Anh ] │
- │ [Toán Học ] │
- │ [Lịch Sử ] │
- │ [...] ] │
- │ │
- │ Chọn Giáo Viên: [Dropdown ▼] │
- │ [Nguyễn Văn A ] │
- │ [Trần Thị B ] │
- │ [...] ] │
- │ │
- ├─────────────────────────────────────┤
- │ [Hủy] [Gán Môn Học] │
- └─────────────────────────────────────┘
-
- API: POST /api/admin/classes/bulk-assign-subjects
-
- Payload:
  \*/
  const assignSubjectPayload = {
  assignments: [
  {
  classId: "675d2000abcd...", // Class._id
  subjectId: "675d4e8a...", // Subject._id
  teacherId: "675d1200..." // Teacher._id
  }
  ]
  };

/\*\*

- Response:
  \*/
  const assignSubjectResponse = {
  success: true,
  message: "Assigned 1/1 subject-teacher pairs",
  successCount: 1,
  failureCount: 0,
  results: [
  {
  classId: "675d2000...",
  success: true,
  message: "Assigned successfully"
  }
  ]
  };

// ============================================
// 8️⃣ SUBJECT MANAGEMENT WORKFLOW (Complete)
// ============================================

/\*\*

- STEP 1: CREATE GLOBAL SUBJECTS
- ┌──────────────────────────────────────┐
- │ Quản Lí Môn Học │
- │ │
- │ [+ Thêm Môn Học Mới] │
- │ │
- │ Danh sách môn học toàn bộ: │
- │ │ Tên Môn │ Giá Tiền │ Thao Tác │
- │ ├──────────────┼──────────┼──────────┤
- │ │ Tiếng Anh │ 500,000 │ [S] [X] │
- │ │ Toán Học │ 450,000 │ [S] [X] │
- │ │ ... │ ... │ ... │
- └──────────────────────────────────────┘
-
- STEP 2: ASSIGN SUBJECTS TO CLASSES
- ┌──────────────────────────────────────┐
- │ Quản Lí Lớp → Chọn Lớp 10A1 │
- │ │
- │ Tab: Thông Tin Cơ Bản Môn Học Lịch │
- │ │
- │ Môn học được học: │
- │ │ Tên Môn │ Giáo Viên │ Thao Tác │
- │ ├──────────────┼────────────┼──────────┤
- │ │ Tiếng Anh │ Nguyễn A │ [Xóa] │
- │ │ Toán Học │ Trần B │ [Xóa] │
- │ │
- │ [+ Gán Môn Học] │
- └──────────────────────────────────────┘
-
- STEP 3: CREATE TIMETABLE
- ┌──────────────────────────────────────┐
- │ Quản Lí Lịch → Lớp 10A1 │
- │ │
- │ Thêm Buổi Học: │
- │ Ngày: [Thứ Hai] │
- │ Môn Học: [Chọn Môn ▼] │
- │ [Tiếng Anh ] │
- │ [Toán Học ] │
- │ Giờ Bắt Đầu: [08:00] │
- │ Giờ Kết Thúc: [09:30] │
- │ │
- │ [Hủy] [Thêm Buổi Học] │
- └──────────────────────────────────────┘
-
- Payload when creating timetable:
  \*/
  const createTimetablePayload = {
  classId: "675d2000...",
  subjects: [], // Optional: can be empty since subjects are already global
  schedule: [
  {
  day: "Monday",
  subjectId: "675d4e8a...", // Use Subject._id here
  startTime: "08:00",
  endTime: "09:30"
  },
  {
  day: "Tuesday",
  subjectId: "675d4e8b...",
  startTime: "09:30",
  endTime: "11:00"
  }
  ]
  };

// ============================================
// 9️⃣ SUMMARY OF CHANGES FOR FRONTEND
// ============================================

/\*\*

- OLD WORKFLOW:
- 1.  Create Subject with class selection
- → Form has "Chọn Lớp" dropdown
- → Subject tied to one class
- 2.  Each class has its own subject list
- → Hard to reuse subjects across classes
- 3.  Timetable accepts subject names as strings
- → Risk of typos, name mismatches
-
- NEW WORKFLOW:
- 1.  Create Subject (GLOBAL, no class selection)
- → Form has ONLY name + price
- → Subject available to ALL classes
- 2.  Assign Subjects to Classes
- → Separate UI: choose class → subject → teacher
- → Uses bulk-assign endpoint
- → Can assign same subject to multiple classes
- 3.  Create Timetable with subjectId
- → schedule includes: day, subjectId, startTime, endTime
- → No more string matching, direct ID reference
- 4.  Grades automatically sync with resolved subject names
- → users.grades shows: { subject: "Tiếng Anh", score: 8.5 }
-
- KEY CHANGES:
- ✅ Remove class selector from Subject create/edit form
- ✅ Add separate "Assign Subject to Class" dialog/page
- ✅ Update timetable form to use subjectId instead of name
- ✅ Display global subject list in Subject Management
  \*/

// ============================================
// 🔟 REACT COMPONENT EXAMPLE (Optional)
// ============================================

/\*\*

- If using React, here's a basic structure:
-
- Components to create/update:
- 1.  SubjectManagement
- - SubjectList (display all global subjects)
- - SubjectForm (create/edit - no class selector)
- - SubjectDelete (confirmation dialog)
-
- 2.  ClassManagement
- - ClassTabs (Basic Info, Subjects & Teachers, Timetable)
- - SubjectsTab
-      - AssignedSubjectsList (show subject-teacher pairs)
-      - AssignSubjectDialog (choose subject + teacher)
-
- 3.  TimetableManagement
- - TimetableForm (schedule entries use subjectId)
- - ScheduleRow (day, subjectId dropdown, time)
-
- API Calls:
- - GET /api/subjects (list all)
- - POST /api/subjects (create)
- - PATCH /api/subjects/:id (edit)
- - DELETE /api/subjects/:id (delete)
- - POST /api/admin/classes/bulk-assign-subjects (assign)
- - POST /api/autoSync (create timetable with subjectId)
    \*/
