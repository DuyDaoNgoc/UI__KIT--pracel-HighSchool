"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSafeUser = void 0;
/* ===========================================================
   ===== Convert IUser -> SafeUser =====
   =========================================================== */
const toSafeUser = (user) => ({
    _id: user._id.toString(),
    studentId: user.studentId,
    teacherId: user.teacherId ?? null,
    parentId: user.parentId ?? null,
    customId: user.customId || "",
    username: user.username,
    email: user.email || "",
    role: user.role || "student",
    name: user.name || "",
    dob: user.dob,
    class: user.class || undefined,
    classCode: user.classCode || "",
    classLetter: user.classLetter || "",
    major: user.major || "",
    grade: user.grade || "",
    schoolYear: user.schoolYear || "",
    teacherName: user.teacherName || "",
    phone: user.phone || "",
    address: user.address || "",
    residence: user.residence || "",
    location: user.location || "", // 🆕
    avatar: user.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    createdAt: user.createdAt || new Date(),
    children: user.children?.map((c) => c.toString()) || [],
    grades: user.grades || [],
    creditsTotal: user.creditsTotal || 0,
    creditsEarned: user.creditsEarned || 0,
    schedule: user.schedule || [],
    tuitionTotal: user.tuitionTotal || 0,
    tuitionPaid: user.tuitionPaid || 0,
    tuitionRemaining: user.tuitionRemaining || 0,
});
exports.toSafeUser = toSafeUser;
