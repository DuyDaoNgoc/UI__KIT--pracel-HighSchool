#!/usr/bin/env node

/**
 * Test Script: Verify Student Tuition Data Flow
 *
 * Usage:
 * node test_student_tuition_flow.js
 *
 * This script checks:
 * 1. StudentTuition records in MongoDB
 * 2. API endpoint response
 * 3. Data format and structure
 */

const fs = require("fs");
const path = require("path");

// ANSI Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
  log("\n" + "=".repeat(70), "cyan");
  log(`  ${text}`, "cyan");
  log("=".repeat(70) + "\n", "cyan");
}

function section(text) {
  log(`\n📌 ${text}`, "blue");
  log("-".repeat(70), "blue");
}

header("🔍 Student Tuition Data Flow Test");

section("1. Check StudentTuition MongoDB Collection");

log(
  `
To check your MongoDB StudentTuition collection, run these commands:

MongoDB Shell:
  mongo

Switch to your database:
  use your_database_name

Count total StudentTuition records:
  db.studenttuitions.countDocuments()

View all StudentTuition records:
  db.studenttuitions.find().pretty()

View StudentTuition records for a specific student:
  db.studenttuitions.find({
    studentId: ObjectId("YOUR_STUDENT_ID")
  }).pretty()

Check StudentTuition structure:
  db.studenttuitions.findOne().pretty()
`,
  "yellow",
);

section("2. Verify API Endpoint with curl");

log(
  `
Test the backend API endpoint:

Get student tuitions (requires valid JWT token):
  curl -X GET \\
    http://localhost:3000/api/student-tuition/student/YOUR_STUDENT_ID \\
    -H "Authorization: Bearer YOUR_JWT_TOKEN"

Expected response format:
  {
    "success": true,
    "data": [
      {
        "_id": "...",
        "studentId": {
          "_id": "...",
          "studentId": "...",
          "name": "..."
        },
        "tuitionId": {
          "_id": "...",
          "classId": "...",
          "semester": 1,
          "totalAmount": 1000000
        },
        "totalAmount": 1000000,
        "paidAmount": 0,
        "remainingAmount": 1000000,
        "status": "unpaid"
      }
    ]
  }
`,
  "yellow",
);

section("3. Browser Console Debug Steps");

log(
  `
Open browser DevTools (F12) and check these:

Step 1: Check if studentId is passed correctly
  // In student profile page
  console.log("Current studentId:", user?._id)

Step 2: Monitor API call
  // Check Network tab → XHR
  // Look for: /api/student-tuition/student/[studentId]
  // Status should be: 200
  // Response should have data array

Step 3: Check Frontend Logs
  // Console should show:
  🔍 [ProfileStats] Fetching tuitions for studentId: ...
  📦 [ProfileStats] API Response received: ...
  ✅ [ProfileStats] Loaded student tuitions: X

Step 4: Verify Data State
  console.log("studentTuitions state:", studentTuitions)
`,
  "yellow",
);

section("4. Common Issues & Solutions");

log(
  `
Issue 1: "Loaded student tuitions: 0"
  ❌ API returned empty array
  Solution:
    - Check if StudentTuition records were created in generate-for-students
    - Verify studentId format matches (should be MongoDB ObjectId)
    - Check Backend logs for "Created X records"

Issue 2: "API Error: 500"
  ❌ Backend endpoint error
  Solution:
    - Check server logs for error messages
    - Ensure MongoDB is running
    - Verify connection string

Issue 3: "Unauthorized 401"
  ❌ JWT token issue
  Solution:
    - Check if user is logged in
    - Verify token is valid
    - Check token expiration

Issue 4: "ClassData has studentCount: 0"
  ❌ No students in the class
  Solution:
    - Add students to the class first
    - Then generate tuition for students
    - Check class.studentIds array in MongoDB
`,
  "yellow",
);

section("5. Debug MongoDB Directly");

log(
  `
Advanced MongoDB checks:

List all StudentTuition records with student names:
  db.studenttuitions.aggregate([
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },
    {
      $project: {
        _id: 1,
        studentName: "$student.name",
        studentId: 1,
        tuitionId: 1,
        totalAmount: 1,
        status: 1
      }
    }
  ]).pretty()

Count records per class:
  db.studenttuitions.aggregate([
    {
      $lookup: {
        from: "tuitions",
        localField: "tuitionId",
        foreignField: "_id",
        as: "tuition"
      }
    },
    { $unwind: "$tuition" },
    {
      $group: {
        _id: "$tuition.classId",
        count: { $sum: 1 }
      }
    }
  ]).pretty()
`,
  "yellow",
);

section("6. Server Logs to Monitor");

log(
  `
When testing, watch for these server logs:

During generate-for-students:
  ✅ [Tuition] Found tuition: { id, classId, totalAmount }
  ✅ [Tuition] Found class: { id, code, studentCount }
  📋 [Tuition] Student IDs to process: N [...]
  ✅ [Tuition] Created StudentTuition record: { id, studentId, tuitionId }
  ✅ [Tuition] Generated X new student tuition records

During student fetch:
  🔍 [StudentTuition] Fetching tuitions for studentId: ...
  📦 [StudentTuition] Query result - Found records: X
  📋 [StudentTuition] Records details: [...]

If any errors:
  ❌ [Tuition] Class not found: ...
  ❌ [StudentTuition] error: ...
`,
  "yellow",
);

section("7. Quick Checklist");

const checks = [
  "Students exist in class (classData.studentIds.length > 0)?",
  "Tuition plan exists (Tuition record in MongoDB)?",
  "StudentTuition records created after generate-for-students?",
  "StudentId format is valid MongoDB ObjectId?",
  "Student JWT token is valid?",
  "Server running without errors?",
  "MongoDB running and connected?",
  "Frontend logs show API response?",
];

checks.forEach((check, i) => {
  log(`  ${i + 1}. [ ] ${check}`, "yellow");
});

header("✅ Test Complete");

log(
  `
Next Steps:
  1. Run through the MongoDB queries above
  2. Check server logs for any error messages
  3. Open browser and check Network tab
  4. Monitor console logs for API calls
  5. Verify data matches expected format

For more help, check: TUITION_DATA_FLOW_DEBUG.md
`,
  "green",
);
