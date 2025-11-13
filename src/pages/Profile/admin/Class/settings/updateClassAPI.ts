import axios from "@/api/axiosConfig";
import type { ApiResponse, ClassType } from "./getClassesAPI";

export const updateClass = async (
  id: string,
  payload: Partial<ClassType>,
): Promise<ApiResponse<ClassType>> => {
  try {
    const res = await axios.put(`/classes/${id}`, payload);
    return res.data as ApiResponse<ClassType>;
  } catch (err: any) {
    console.error("updateClass error:", err);
    return { success: false, message: err.message };
  }
};
