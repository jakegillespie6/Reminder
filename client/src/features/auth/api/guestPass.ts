import api, { publicApi } from "@lib/api";

export type GuestPassStartResponse = {
  code: string;
  redeem_url: string;
  issued_at: string;
  expires_at: string;
  expires_in: number;
};

export type GuestPassRedeemResponse = {
  access: string;
  token_type: "Bearer";
  expires_in: number;
};

export async function startGuestPass(): Promise<GuestPassStartResponse> {
  const { data } = await api.post<GuestPassStartResponse>("/auth/guest-pass/start/");
  return data;
}

export async function redeemGuestPass(code: string): Promise<GuestPassRedeemResponse> {
  const { data } = await publicApi.post<GuestPassRedeemResponse>("/auth/guest-pass/redeem/", { code });
  return data;
}