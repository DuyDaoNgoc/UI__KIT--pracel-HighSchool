"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStudentId = generateStudentId;
exports.generateTeacherId = generateTeacherId;
exports.generateParentId = generateParentId;
// server/utils/generateIds.ts
function generateStudentId(className) {
    const random = Math.floor(1000 + Math.random() * 9000); // 4 số ngẫu nhiên
    return `${className}-${random}`;
}
function generateTeacherId(subject) {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `GV-${subject.toUpperCase()}-${random}`;
}
function generateParentId() {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `PH-${random}`;
}
