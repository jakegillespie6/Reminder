import api from "@lib/api";

export const refreshToken = async (refresh: string) => {
  const response = await api.post("/auth/base/refresh-token/", { refresh });
  return response.data;
};