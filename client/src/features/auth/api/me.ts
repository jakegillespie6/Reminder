import api from "@lib/api";

export type AccountMe = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

export type GuestMe = {
  guest: true;
  guest_session_id: string;
  issuer: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
};

export type MeResponse = AccountMe | GuestMe;

export async function me(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/auth/base/me/");
  return data;
}

export function isGuestMe(value: MeResponse): value is GuestMe {
  return (value as GuestMe).guest === true;
}