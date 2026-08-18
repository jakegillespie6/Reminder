import api from "@lib/api";
import type { Account } from "../../accounts/types";

export const me = async (): Promise<Account> => {
  const response = await api.get<Account>("/auth/me/");
  return response.data;
};