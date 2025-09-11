export interface NewsInput {
  title: string;
  content: string;
}

export interface NewsUpdate {
  title?: string;
  content?: string;
  status?: "pending" | "approved" | "rejected";
}
