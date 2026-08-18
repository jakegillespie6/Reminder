import api from "@lib/api";

export const signIn = async (token: string) => {
  const { data } = await api.post("/auth/google/sign-in/", { token });

  const access = data?.tokens?.access ?? data?.access ?? data?.access_token;
  const refresh = data?.tokens?.refresh ?? data?.refresh ?? data?.refresh_token;

  if (access) localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);

  return data;
};