import http from "../../../../../api/axiosConfig";

export interface CreateClassResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const createClass = async (
  formData: Record<string, any>,
): Promise<CreateClassResponse> => {
  const { data } = await http.post<CreateClassResponse>("/classes", formData);
  return data;
};
