import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  const url = config.url ?? "";
  const isRefreshRoute = /\/auth\/base\/refresh-token\/?$/.test(url);

  if (token && !isRefreshRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;
    const status = error?.response?.status;
    const url = originalRequest?.url ?? "";
    const isRefreshRoute = /\/auth\/base\/refresh-token\/?$/.test(url);

    if (status === 401 && !originalRequest?._retry && !isRefreshRoute) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) throw new Error("No refresh token");

        const refreshResponse = await api.post("/auth/base/refresh-token/", { refresh });
        const newAccess = refreshResponse?.data?.access;
        if (!newAccess) throw new Error("No access token in refresh response");

        localStorage.setItem("access_token", newAccess);
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("account");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;