import { Account } from "@features/accounts/types";

export type TokenPair = {
  access: string;
  refresh: string;
};

export type AuthMeResponse = {
  account: Account;
};

export type GoogleTokenRequest = {
  token: string;
};

export type RefreshTokenRequest = {
  refresh: string;
};

export type RefreshTokenResponse = TokenPair;

export type SignInResponse = {
    tokens: TokenPair;
    account: Account;
}

export type SignUpResponse = {
  tokens: TokenPair;
  account: Account;
}

export type DeviceStartResponse = {
  session_id: string;
  poll_token: string;
  verification_uri: string;
  expires_at: string;
};

export type DeviceApproveRequest = {
  session_id: string;
};

export type DevicePollRequest = {
  session_id: string;
  poll_token: string;
};

export type DevicePollPendingResponse = {
  status: "pending";
};

export type DevicePollApprovedResponse = {
  status: "approved";
  tokens: TokenPair;
  account: Account;
};

export type DevicePollResponse =
  | DevicePollPendingResponse
  | DevicePollApprovedResponse;