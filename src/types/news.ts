// src/types/news.ts
export interface INews {
  _id: string; // Mongo _id serialized to string
  id?: number; // nếu backend trả id số
  title: string;
  content: string;
  author?: string;
  status?: "pending" | "approved" | "rejected";
  createdAt?: string;
  updatedAt?: string;
}
