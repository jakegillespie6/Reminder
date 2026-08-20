import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const publicApi = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

function parseJwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isGuestToken(token: string | null): boolean {
  const payload = parseJwtPayload(token);
  return payload?.guest === true;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const access = localStorage.getItem("access_token");
    const refresh = localStorage.getItem("refresh_token");

    // Guest sessions are access-token only. Do not attempt refresh/logout here.
    if (isGuestToken(access)) {
      return Promise.reject(error);
    }

    if (!refresh) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const { data } = await publicApi.post<{ access: string; refresh?: string }>(
        "/auth/base/refresh-token/",
        { refresh }
      );

      localStorage.setItem("access_token", data.access);
      if (data.refresh) localStorage.setItem("refresh_token", data.refresh);

      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${data.access}`;
      return api(original);
    } catch (refreshErr) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return Promise.reject(refreshErr);
    }
  }
);

export default api;