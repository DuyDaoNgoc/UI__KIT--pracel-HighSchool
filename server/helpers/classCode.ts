// Helper để sinh mã lớp dựa trên khối, lớp và ngành
export function generateClassCode(
  grade: string,
  classLetter: string,
  major: string
): string {
  // Rút gọn ngành thành viết tắt (VD: "Công nghệ thông tin" => "CNTT")
  const majorAbbrev = major
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return `${grade}${classLetter}-${majorAbbrev}`;
}
