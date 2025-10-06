"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateClassCode = generateClassCode;
// Helper để sinh mã lớp dựa trên khối, lớp và ngành
function generateClassCode(grade, classLetter, major) {
    // Rút gọn ngành thành viết tắt (VD: "Công nghệ thông tin" => "CNTT")
    const majorAbbrev = major
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase())
        .join("");
    return `${grade}${classLetter}-${majorAbbrev}`;
}
