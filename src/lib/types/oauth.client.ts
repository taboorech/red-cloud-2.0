import { Auth } from "googleapis";

export interface IGoogleClient {
  createAuthClient(): Auth.OAuth2Client;
  getAuthUrl(browser: string): Promise<string>;
  exchangeAuthCode(code: string): Promise<Auth.Credentials>;
  getProfile(tokens: Auth.Credentials): Promise<{
    email: string;
    name: string;
    avatar: string;
    externalId: string;
  }>;
}
