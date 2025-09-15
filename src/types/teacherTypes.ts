// src/types/teacher.ts
export interface ITeacher {
  _id: string;
  name: string;
  email: string;
  assignedClassCode?: string;
  role?: string; // teacher/admin
}
