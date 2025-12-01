import { Auth, google } from "googleapis";
import { injectable } from "inversify";

import { IGoogleClient } from "../types/oauth.client";

@injectable()
export class GoogleClient implements IGoogleClient {
  constructor() {}

  createAuthClient(): Auth.OAuth2Client {
    const clientID: string = process.env.GOOGLE_CLIENT_ID as string;
    const clientSecret: string = process.env.GOOGLE_CLIENT_SECRET as string;

    const client = new google.auth.OAuth2(
      clientID,
      clientSecret,
      process.env.GOOGLE_REDIRECT_URI_PATH!,
    );

    return client;
  }

  public async getAuthUrl(browser: string): Promise<string> {
    const client = this.createAuthClient();

    return client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      prompt: "consent",
      state: browser,
    });
  }

  public async exchangeAuthCode(code: string): Promise<Auth.Credentials> {
    const client = this.createAuthClient();
    const creds = await client.getToken(code);

    return creds.tokens;
  }

  public async getProfile(tokens: Auth.Credentials): Promise<{
    email: string;
    name: string;
    avatar: string;
    externalId: string;
    locale: string;
  }> {
    const client = this.createAuthClient();
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: client });

    const res = await oauth2.userinfo.get();

    const profile = res.data;

    return {
      email: profile.email!,
      name: profile.name!,
      avatar: profile.picture!,
      externalId: profile.id!,
      locale: profile.locale!,
    };
  }

  public async refreshToken(refreshToken: string): Promise<Auth.Credentials> {
    const client = this.createAuthClient();
    client.setCredentials({ refresh_token: refreshToken });

    const tokens = await client.refreshAccessToken();

    return tokens.credentials;
  }
}
