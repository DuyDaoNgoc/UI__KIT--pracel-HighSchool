export interface IUserProfile {
  _id: string;
  username: string;
  email?: string;
  role: string;
  class?: string;
  schoolYear?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  children?: string[];
}

export interface IGrade {
  subject: string;
  score: number;
}

export interface ICredit {
  total: number;
  earned: number;
}

export interface IScheduleItem {
  day: string;
  subjects: string[];
}

export interface ITuition {
  total: number;
  paid: number;
  remaining: number;
  daycare?: number; // tiền bán trú
  boarding?: number;
}
