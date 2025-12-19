# 📚 Tuition Management System - Implementation Guide

## 🎯 Overview

Complete backend and frontend implementation for managing tuition plans by major, semester, and subject enrollment.

## ✅ What Was Created

### 1. Backend Components

#### Model: `server/models/Tuition.ts`

- **Structure**: Major + Semester + Subject Array + Auto-calculated Total
- **Features**:
  - `majorId`: Reference to Major
  - `semester`: 1 or 2 (enum validation)
  - `subjects`: Array of {subjectId, price}
  - `totalAmount`: Auto-calculated from subject prices
  - `isActive`: Boolean flag for plan activation
  - **Indexes**: `majorId + semester` for fast lookup

#### API Routes: `server/Routers/Tuition/index.ts`

All endpoints require admin role and authentication:

**GET Endpoints:**

- `GET /api/tuitions` - List all tuition plans (populated majors)
- `GET /api/tuitions/:id` - Get single plan details
- `GET /api/tuitions/major/:majorId?semester=X` - Get by major and semester

**CREATE Endpoint:**

- `POST /api/tuitions` - Create new tuition plan
  - Validates major exists
  - Checks all subjects exist
  - Auto-calculates totalAmount
  - Prevents duplicate (major + semester)
  - Response: Created tuition object (populated)

**UPDATE Endpoint:**

- `PUT /api/tuitions/:id` - Update tuition plan
  - Recalculates totalAmount if subjects change
  - Response: Updated tuition object

**DELETE Endpoint:**

- `DELETE /api/tuitions/:id` - Delete tuition plan

**UTILITY Endpoint:**

- `POST /api/tuitions/:tuitionId/generate-for-students` - Auto-assign to students
  - Finds all students matching the major
  - Returns count of students found
  - Ready for future payment record creation

#### Admin Routes: `server/Routers/admin/admin.ts`

Added two helper endpoints:

- `GET /admin/majors` - Get all majors (for dropdown)
- `GET /admin/subjects` - Get all subjects (for checkbox list)

#### Server Integration: `server/server.ts`

- Imported tuition routes
- Registered at `/api/tuitions`

### 2. Frontend Components

#### Component: `src/pages/Profile/admin/Tuition/TuitionTab.tsx`

Professional admin interface with:

**Form Section:**

- Major dropdown selector
- Semester selector (Kì 1 / Kì 2)
- Subject multi-checkbox with prices displayed
- Description textarea (optional)
- Auto-calculated total display
- "Tạo Bảng Học Phí" button

**List Section:**

- Search by major name
- Table with: Major | Semester | Subject Count | Total Amount | Status | Actions
- 💰 Display total in Vietnamese currency format
- Status badge: ✅ Kích Hoạt / ❌ Vô Hiệu
- Action buttons:
  - ⚙️ **Phân công** - Generate tuitions for students
  - 🗑️ **Xóa** - Delete tuition plan

**State Management:**

- `tuitions`: List of all plans
- `majors`: Available majors
- `subjects`: Available subjects
- `selectedMajor`, `selectedSemester`, `selectedSubjectIds`: Form state
- `loading`, `creating`: UI states

**Error Handling:**

- React Hot Toast notifications
- Validation: Major and subjects required
- Confirmation dialogs before delete/generate

#### Admin Profile Integration: `src/pages/Profile/admin/AdminProfile.tsx`

- Added TuitionTab import
- Added tab case: `{activeTab === "tuitions" && <TuitionTab />}`

#### Admin Sidebar: `src/pages/Profile/admin/AdminSidebar.tsx`

- Added "Bảng học phí" menu item with 💵 DollarSign icon
- Tab: `tuitions` - Click to navigate to tuition management

## 🚀 How to Use

### For Admins:

1. **Create Tuition Plan:**
   - Click "Bảng học phí" in Admin Panel sidebar
   - Select Major (e.g., CNTT - Computer Science)
   - Select Semester (1 or 2)
   - Check subjects you want to include
   - See auto-calculated total
   - Click "Tạo Bảng Học Phí"

2. **View Existing Plans:**
   - Plans appear in table below form
   - Search by major name
   - See total amount and subject count

3. **Auto-assign to Students:**
   - Click ⚙️ **Phân công** button
   - Confirm dialog
   - System finds all students in that major
   - Returns count of students processed

4. **Delete Plan:**
   - Click 🗑️ **Xóa** button
   - Confirm deletion

### API Usage (for Developers):

```bash
# Create tuition plan
POST /api/tuitions
{
  "majorId": "507f1f77bcf86cd799439011",
  "semester": 1,
  "subjectIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "description": "Kì 1 khối A"
}

# Get all plans
GET /api/tuitions

# Get by major and semester
GET /api/tuitions/major/507f1f77bcf86cd799439011?semester=1

# Update plan
PUT /api/tuitions/507f1f77bcf86cd799439020
{
  "subjectIds": ["507f1f77bcf86cd799439012"]
}

# Delete plan
DELETE /api/tuitions/507f1f77bcf86cd799439020

# Auto-generate for students
POST /api/tuitions/507f1f77bcf86cd799439020/generate-for-students
```

## 📊 Data Flow

```
Admin UI
  ↓
Select Major → Load Subjects → Display with Prices
  ↓
Select Semester + Subjects
  ↓
Auto-calculate Total
  ↓
POST /api/tuitions (Admin only)
  ↓
Backend validates + creates
  ↓
Response: Tuition object with populated major/subjects
  ↓
Display in table
```

## 🔐 Security

- All endpoints require `verifyToken` middleware
- All endpoints require `checkRole(["admin"])`
- Input validation on all creates/updates
- Duplicate prevention for (major + semester) pairs
- Subject existence verification

## 🎨 UI/UX Features

- Professional card-based layout
- Vietnamese locale formatting (currency)
- Real-time total calculation
- Responsive table design
- Toast notifications for success/error
- Loading states
- Confirmation dialogs
- Search functionality
- Status badges with color coding

## 📝 Styling

Uses centralized SCSS:

- `src/stylesheets/components/profile/_grades.scss`
- Classes: `.profile__card`, `.form-group`, `.profile__table`, etc.
- Consistent with existing admin interface

## 🔄 Next Steps (Optional)

1. **Auto-generate Student Payments:**
   - Enhance `/generate-for-students` to create Payment records
   - Link to existing Payment system

2. **Student View:**
   - Display assigned tuitions in Student Profile
   - Show payment status

3. **Reporting:**
   - Generate tuition revenue reports
   - Track payment collection

4. **Batch Operations:**
   - Upload tuition plans via CSV
   - Bulk-assign to multiple majors

## 📁 Files Created/Modified

**Created:**

- ✅ `server/models/Tuition.ts` (Model)
- ✅ `server/Routers/Tuition/index.ts` (API - 300+ lines)
- ✅ `src/pages/Profile/admin/Tuition/TuitionTab.tsx` (UI Component)

**Modified:**

- ✅ `server/server.ts` (Added import + route registration)
- ✅ `server/Routers/admin/admin.ts` (Added helpers + imports)
- ✅ `src/pages/Profile/admin/AdminProfile.tsx` (Added import + tab case)
- ✅ `src/pages/Profile/admin/AdminSidebar.tsx` (Added menu item)

## ✨ Validation & Testing

- ✅ All TypeScript errors fixed (0 errors)
- ✅ Proper error handling in try-catch blocks
- ✅ Input validation (required fields, array checks)
- ✅ Duplicate prevention
- ✅ Foreign key validation (major, subjects exist)
- ✅ Responsive UI
- ✅ Toast notifications working

## 🎓 Example Data

```json
{
  "_id": "507f1f77bcf86cd799439020",
  "majorId": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Công Nghệ Thông Tin"
  },
  "semester": 1,
  "subjects": [
    {
      "subjectId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Toán cao cấp",
        "price": 500000
      },
      "price": 500000
    },
    {
      "subjectId": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Vật lý",
        "price": 450000
      },
      "price": 450000
    }
  ],
  "totalAmount": 950000,
  "description": "Bảng học phí kì 1 khối A",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

**Status**: ✅ Complete and Ready for Production
**Version**: 1.0
**Last Updated**: 2024
