/\*\*

- ========================================
- FRONTEND API PAYLOAD DOCUMENTATION
- Global Subject & Class Assignment Workflow
- ========================================
-
- Updated: 2025-12-11
-
- This document provides payload examples for the frontend to interact with
- the new global subject workflow (subjects created globally, assigned to classes later).
  \*/

// ============================================
// 1️⃣ CREATE SUBJECT (Global, no class required)
// ============================================

/\*

- Endpoint: POST /api/subjects
-
- Request:
  \*/
  {
  "name": "Tiếng Anh",
  "price": 500000
  }

/\*

- Response (201):
- {
- "message": "Subject created",
- "subject": {
-     "_id": "675d4e8a1234567890abcdef",
-     "name": "Tiếng Anh",
-     "price": 500000,
-     "createdAt": "2025-12-11T10:00:00.000Z",
-     "updatedAt": "2025-12-11T10:00:00.000Z"
- }
- }
  \*/

// ============================================
// 2️⃣ GET ALL SUBJECTS (Global only)
// ============================================

/\*

- Endpoint: GET /api/subjects
-
- Response (200):
- {
- "data": [
-     {
-       "_id": "675d4e8a1234567890abcdef",
-       "name": "Tiếng Anh",
-       "price": 500000,
-       "createdAt": "2025-12-11T10:00:00.000Z",
-       "updatedAt": "2025-12-11T10:00:00.000Z"
-     },
-     { ... }
- ]
- }
  \*/

// ============================================
// 3️⃣ GET SUBJECTS FOR A CLASS
// ============================================

/\*

- Endpoint: GET /api/subjects/class/{classId}
-
- Returns:
- - Subjects explicitly assigned to this class (classId field exists)
- - Global subjects (no classId or classId is null)
-
- Response (200):
- {
- "data": [
-     {
-       "_id": "675d4e8a...",
-       "name": "Tiếng Anh",
-       "price": 500000,
-       "classId": null // or undefined = global subject
-     },
-     { ... }
- ]
- }
  \*/

// ============================================
// 4️⃣ ASSIGN SUBJECT TO CLASS (Single)
// ============================================

/\*

- Endpoint: POST /api/classes/assign-teacher-bulk
-
- Request:
  \*/
  {
  "teacherId": "675d1234...",
  "assignments": [
  {
  "classCode": "10A1",
  "type": "subject",
  "subject": "675d4e8a1234567890abcdef" // Subject._id (string)
  }
  ]
  }

/\*

- Response (200):
- {
- "success": true,
- "message": "Xếp giáo viên hoàn tất",
- "results": [
-     {
-       "classCode": "10A1",
-       "success": true
-     }
- ]
- }
  \*/

// ============================================
// 5️⃣ BULK ASSIGN SUBJECTS TO CLASSES
// ============================================

/\*

- Endpoint: POST /api/admin/classes/bulk-assign-subjects
-
- Request:
  \*/
  {
  "assignments": [
  {
  "classId": "675d2000...", // Class._id (string)
  "subjectId": "675d4e8a...", // Subject._id (string)
  "teacherId": "675d1200..." // Teacher._id (string)
  },
  {
  "classId": "675d2001...",
  "subjectId": "675d4e8b...",
  "teacherId": "675d1201..."
  }
  ]
  }

/\*

- Response (200):
- {
- "success": true,
- "message": "Assigned 2/2 subject-teacher pairs",
- "successCount": 2,
- "failureCount": 0,
- "results": [
-     {
-       "classId": "675d2000...",
-       "success": true,
-       "message": "Assigned successfully"
-     },
-     {
-       "classId": "675d2001...",
-       "success": true,
-       "message": "Assigned successfully"
-     }
- ]
- }
  \*/

// ============================================
// 6️⃣ CREATE TIMETABLE WITH AUTOSYNC
// ============================================

/\*

- Endpoint: POST /api/autoSync
-
- Request (supports both old and new format):
  \*/
  {
  "classId": "675d2000...",
  "subjects": [
  {
  "name": "Tiếng Anh",
  "price": 500000
  }
  ],
  "schedule": [
  {
  "day": "Monday",
  "subjectId": "675d4e8a...", // 🆕 NEW: use subjectId (preferred)
  "startTime": "08:00",
  "endTime": "09:30"
  },
  {
  "day": "Tuesday",
  "subjectName": "Tiếng Anh", // 🔄 OLD: still supported (fallback)
  "startTime": "09:30",
  "endTime": "11:00"
  }
  ]
  }

/\*

- Response (201):
- {
- "message": "Auto sync completed",
- "subjects": [ ... ],
- "timetable": {
-     "_id": "675d3000...",
-     "classId": "675d2000...",
-     "schedule": [
-       {
-         "day": "Monday",
-         "subjectId": "675d4e8a...",
-         "startTime": "08:00",
-         "endTime": "09:30"
-       },
-       { ... }
-     ]
- },
- "paymentsCreated": 120
- }
  \*/

// ============================================
// 7️⃣ FRONTEND UI FLOW EXAMPLE
// ============================================

/\*

- Step 1: Admin creates a subject (global)
- POST /api/subjects
- { name: "Tiếng Anh", price: 500000 }
- → Returns Subject.\_id (e.g., "675d4e8a...")
-
- Step 2: Admin selects class and assigns subject + teacher
- POST /api/admin/classes/bulk-assign-subjects
- {
-     "assignments": [
-       { classId: "675d2000", subjectId: "675d4e8a", teacherId: "675d1200" }
-     ]
- }
- → Subject now assigned to class with teacher
-
- Step 3: Admin creates timetable using subjectId
- POST /api/autoSync
- {
-     "classId": "675d2000",
-     "subjects": [],  // optional: can be empty if subjects already created
-     "schedule": [
-       { day: "Monday", subjectId: "675d4e8a", startTime: "08:00", endTime: "09:30" }
-     ]
- }
- → Timetable persists with subjectId reference
-
- Step 4: Teacher logs in and enters grades (already synced to users.grades)
- Teacher submits grades for student in subject
- → Automatically synced to users.grades with subject name resolved
  \*/

// ============================================
// 8️⃣ KEY CHANGES FROM OLD WORKFLOW
// ============================================

/\*

- OLD WORKFLOW:
- 1.  Subject creation required selecting a class
- → POST /api/subjects with classId required
- 2.  Subjects stored with classId tied to specific class
- 3.  Timetable accepted subjectName strings
- → Had to match names manually
- 4.  User.grades stored subject.\_id as string
- → Display required separate lookup
-
- NEW WORKFLOW:
- 1.  Subject creation is global (no classId required)
- → POST /api/subjects with only name + price
- 2.  Subjects are reusable across multiple classes
- 3.  Class.subjectTeachers stores { subjectId, subjectName, teacherId, teacherName }
- → Prevents duplicate entries, clear reference structure
- 4.  Timetable references subjectId directly
- → schedule: [{ day, subjectId, startTime, endTime }]
- 5.  User.grades stores resolved subject names for display
- → { subject: "Tiếng Anh", score: 8.5 }
  \*/

// ============================================
// 9️⃣ MIGRATION NOTE
// ============================================

/\*

- If you have existing classes with old-format subjectTeachers:
-
- Run migration script to convert:
- npx ts-node server/migrations/migrateSubjectTeachers.ts
-
- This will:
- - Find all classes with string-based subjects
- - Lookup or create Subject documents by name
- - Convert to new format: { subjectId, subjectName, teacherId, teacherName }
- - Preserve all teacher assignments
    \*/

// ============================================
// 🔟 HELPFUL ADMIN ENDPOINTS
// ============================================

/\*

- Bulk sync students/teachers to users collection:
- POST /api/admin/sync/users
-
- Debug sync for specific student/teacher:
- GET /api/admin/debug/{studentIdOrTeacherId}
-
- Bulk assign multiple subjects to classes:
- POST /api/admin/classes/bulk-assign-subjects
  \*/
