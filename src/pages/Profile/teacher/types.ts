// src/pages/Profile/TeacherProfile/types.ts
import type { User } from "../../../types/auth";

export type IGrade = { subject: string; score: number };

export interface IStudent {
  _id: string;
  username: string;
  class?: string;
  schoolYear?: string;
  grades?: IGrade[];
  [k: string]: any;
}

export interface IDailyReport {
  date: string;
  summary: string;
  updatesRequested: number;
  notes?: string;
}

export type FEUser = User & { [k: string]: any };
