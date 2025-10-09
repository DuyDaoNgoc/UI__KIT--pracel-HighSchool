import http from "../../../../../api/axiosConfig";

export interface DeleteClassResponse {
  success: boolean;
  message?: string;
}

export const deleteClass = async (id: string): Promise<DeleteClassResponse> => {
  const { data } = await http.delete<DeleteClassResponse>(`/classes/${id}`);
  return data;
};
