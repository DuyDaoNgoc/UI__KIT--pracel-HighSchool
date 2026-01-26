# Debug Guide: Student Tuition Not Loading

## Issue

StudentTuition data is not appearing in student profile (ProfileTuition.tsx and ProfileStatistics.tsx) even after admin creates tuition records.

## Root Cause Investigation

The issue is typically one of these:

1. **No StudentTuition records exist** for the student in database
2. **StudentId format mismatch** - studentId stored doesn't match the query
3. **Tuition not yet generated** - admin clicked "Tạo bảng học phí" but records weren't created

## Debug Steps

### Step 1: Check Server Logs for Errors

When admin clicks "Tạo bảng học phí" (Generate for Students), look for these logs:

```
📝 [Tuition] Generating student tuitions for tuition plan: <TUITION_ID>
✅ [Tuition] Found tuition: {id, classId, totalAmount}
✅ [Tuition] Found class: {id, code, studentCount}
📋 [Tuition] Student IDs to process: <COUNT> [IDs...]
✅ [Tuition] Created StudentTuition record: {id, studentId, tuitionId}
```

**If you see warnings or errors:**

- `❌ [Tuition] Tuition not found` → Tuition ID is invalid
- `❌ [Tuition] Class not found` → Class doesn't exist or tuition's classId is wrong
- `⚠️ [Tuition] No students found in this class` → Class has no students
- `⚠️ [Tuition] Failed to create tuition for student` → Database error

### Step 2: Check Frontend Console When Loading Student Profile

When student opens their profile, look for:

```
🔍 [ProfileTuition] Fetching tuitions for studentId: <STUDENT_ID> Type: string
📦 [ProfileTuition] API Response status: 200
📦 [ProfileTuition] API Response received: {success: true, data: [...]}
✅ [ProfileTuition] Loaded student tuitions: <COUNT> records
```

**If data count is 0:**

```
⚠️ [ProfileTuition] No tuitions found. This might mean:
  1. No StudentTuition records exist for this student
  2. Admin hasn't generated tuition records yet
  3. StudentId format mismatch in database
```

### Step 3: Use Debug Endpoints

#### Check All StudentTuition Records in Database

```
GET /api/student-tuition/debug/all-raw
```

Response includes:

- `totalRecords` - Total StudentTuition count
- `data` - All records with their studentId and types
- `sampleStudentIds` - Shows studentId format being stored

#### Search for Specific Student ID

```
GET /api/student-tuition/debug/search/:studentId
```

Replace `:studentId` with the actual student ID (e.g., `693be811db233159987dabf4`)

Response shows:

- `directQuery` - MongoDB direct query result
- `manualFilter` - Manual string comparison result
- `sampleRecords` - Shows how studentId is stored vs queried

**Example: If no direct matches but manual filter finds records:**

```
directQuery: { count: 0 },
manualFilter: { count: 3 },  // <- Means ObjectId format mismatch!
```

### Step 4: Database Check

Connect to MongoDB and check:

```javascript
// Show all StudentTuition records
db.studenttuitions.find({}).limit(5);

// Count by student
db.studenttuitions.aggregate([
  { $group: { _id: "$studentId", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);

// Search for specific student
db.studenttuitions.find({ studentId: ObjectId("693be811db233159987dabf4") });
```

## Common Solutions

### Problem 1: "studentId format mismatch"

**Symptom:** API returns empty array but debug/search/:studentId shows matches in manual filter

**Solution:** Check Student model - is studentId a String or ObjectId?

```typescript
// In Student.ts model, check:
studentId: {
  type: String,  // or ObjectId?
  required: true,
  unique: true
}
```

If it's inconsistent between what Student model uses vs StudentTuition model, need to convert.

### Problem 2: "No students in class"

**Symptom:** Logs show `⚠️ [Tuition] No students found in this class`

**Solution:**

1. Check Class has studentIds populated
2. Verify students are actually assigned to that class
3. Check Class model's studentIds field structure

### Problem 3: "StudentTuition created but not fetched"

**Symptom:** Server logs show `✅ [Tuition] Created StudentTuition record` but student gets empty data

**Solution:**

1. Check endpoint `/student-tuition/student/:studentId` logs
2. Verify studentId in URL matches format in database
3. Try `/api/student-tuition/debug/search/:studentId` to see format mismatch

## Quick Testing Script

```javascript
// Run in browser console on student profile page:

// 1. Check student ID
const studentId = "693be811db233159987dabf4"; // Replace with actual

// 2. Call debug endpoint
fetch("/api/student-tuition/debug/search/" + studentId, {
  headers: { Authorization: "Bearer " + localStorage.getItem("token") },
})
  .then((r) => r.json())
  .then((data) => {
    console.log("Direct Query:", data.directQuery.count);
    console.log("Manual Filter:", data.manualFilter.count);
    console.log(
      "Sample StudentIds:",
      data.sampleRecords.map((r) => r.studentIdString),
    );
  });
```

## Enhanced Logging Already Added

The following files now have detailed logging:

1. **Backend:**
   - `server/Routers/StudentTuition/index.ts` - GET endpoints with full logging
   - `server/Routers/Tuition/index.ts` - generate-for-students with detailed studentId logging
   - New debug endpoints added: `/debug/all-raw` and `/debug/search/:studentId`

2. **Frontend:**
   - `src/pages/Profile/Students/ProfileTuition.tsx` - Enhanced logging on fetch
   - `src/pages/Profile/Students/ProfileStatistics.tsx` - Enhanced logging on fetch

## Next Steps If Still Not Working

1. **Check if generate-for-students endpoint returns 200** - Use Postman to call it
2. **Manually test the search endpoint** - See if it finds records
3. **Verify class has students** - Check in admin dashboard
4. **Check logs for any errors** - Search console for `❌ [` patterns

## Contact Info

If issue persists, provide:

- Student ID
- Tuition ID that was generated
- Server console output from when "Tạo bảng học phí" was clicked
- Response from `/api/student-tuition/debug/search/:studentId`
