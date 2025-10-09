import http from "../../../../../api/axiosConfig";

export interface UpdateClassResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const updateClass = async (
  id: string,
  updates: Record<string, any>,
): Promise<UpdateClassResponse> => {
  const { data } = await http.put<UpdateClassResponse>(
    `/classes/${id}`,
    updates,
  );
  return data;
};
