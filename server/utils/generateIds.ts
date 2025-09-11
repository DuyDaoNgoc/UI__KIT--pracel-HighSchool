// server/utils/generateIds.ts
export function generateStudentId(className: string): string {
  const random = Math.floor(1000 + Math.random() * 9000); // 4 số ngẫu nhiên
  return `${className}-${random}`;
}

export function generateTeacherId(subject: string): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `GV-${subject.toUpperCase()}-${random}`;
}

export function generateParentId(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PH-${random}`;
}
