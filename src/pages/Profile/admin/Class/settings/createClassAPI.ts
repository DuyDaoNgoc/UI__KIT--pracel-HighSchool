import http from "@/api/axiosConfig";
import type { ApiResponse, ClassType } from "./getClassesAPI";

export const createClass = async (
  payload: Omit<ClassType, "_id">,
): Promise<ApiResponse<ClassType>> => {
  try {
    // ✅ Gửi cả 4 field: grade, schoolYear, classLetter, major
    const cleanPayload = {
      grade: payload.grade,
      schoolYear: payload.schoolYear,
      classLetter: payload.classLetter,
      major: payload.major,
    };

    console.log(
      "📤 Gửi request đến:",
      `${http.defaults.baseURL}/classes/create`,
    );
    console.log("📦 Payload:", cleanPayload);

    const res = await http.post("/classes/create", cleanPayload);
    return res.data as ApiResponse<ClassType>;
  } catch (err: any) {
    console.error("❌ createClass error:", err.response?.status, err.message);
    return { success: false, message: err.message };
  }
};
