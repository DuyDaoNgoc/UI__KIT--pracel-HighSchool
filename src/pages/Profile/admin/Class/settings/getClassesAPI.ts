import axios from "@/api/axiosConfig";

export interface ClassType {
  _id: string;
  grade: string;
  schoolYear: string;
  classLetter: string;
  major: string;
  classCode: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export const getClasses = async (): Promise<ApiResponse<ClassType[]>> => {
  try {
    const res = await axios.get("/classes");
    return res.data as ApiResponse<ClassType[]>; // ✅ ép kiểu
  } catch (err: any) {
    console.error("getClasses error:", err);
    return { success: false, message: err.message };
  }
};
