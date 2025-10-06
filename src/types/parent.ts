// src/types/parent.ts

export interface IParent {
  _id: string; // ID trong MongoDB
  name: string; // Tên phụ huynh
  email?: string; // Email (nếu có)
  phone?: string; // Số điện thoại (nếu có)
  childrenIds?: string[]; // Mảng ID học sinh con của phụ huynh
  createdAt?: string; // Ngày tạo
  updatedAt?: string; // Ngày cập nhật
}
