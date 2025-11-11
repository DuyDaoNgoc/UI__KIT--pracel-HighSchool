import axios from "@/api/axiosConfig";
import type { ApiResponse, ClassType } from "./getClassesAPI";

export const createClass = async (
  payload: Omit<ClassType, "_id">,
): Promise<ApiResponse<ClassType>> => {
  try {
    const res = await axios.post("/classes", payload);
    return res.data as ApiResponse<ClassType>; // ✅ ép kiểu
  } catch (err: any) {
    console.error("createClass error:", err);
    return { success: false, message: err.message };
  }
};
