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