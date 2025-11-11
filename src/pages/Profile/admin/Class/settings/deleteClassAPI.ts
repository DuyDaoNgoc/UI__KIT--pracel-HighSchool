import axios from "@/api/axiosConfig";
import type { ApiResponse } from "./getClassesAPI";

export const deleteClass = async (id: string): Promise<ApiResponse<null>> => {
  try {
    const res = await axios.delete(`/classes/${id}`);
    return res.data as ApiResponse<null>; // ✅ ép kiểu
  } catch (err: any) {
    console.error("deleteClass error:", err);
    return { success: false, message: err.message };
  }
};
