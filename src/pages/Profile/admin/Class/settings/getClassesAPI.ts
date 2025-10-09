import http from "../../../../../api/axiosConfig";

export interface GetClassesResponse {
  success: boolean;
  data?: any[];
  message?: string;
}

export const getAllClasses = async (): Promise<GetClassesResponse> => {
  const res = await http.get<GetClassesResponse>("/classes");
  return res.data;
};
