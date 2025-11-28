import * as bcrypt from "bcrypt";
import { inject, injectable } from "inversify";
import jwt, { SignOptions } from "jsonwebtoken";

import { Provider } from "../enum/provider.enum";
import { AppError } from "../errors/app.error";
import { GoogleClient } from "../google/google.client";
import { IInternalTokens } from "../types/credentials";
import { IUser, UserModel } from "../db/models/user.model";
import { UserProviderCredentialsModel } from "../db/models/user-provider-credentials.model";
import { UserRefreshTokenModel } from "../db/models/user-refresh-token.model";
import { UserRole } from "../enum/user.enum";
import { UserHashCredentialsService } from "./user-hash-credentials.sevice";

@injectable()
export class AuthService {
  constructor(
    @inject(GoogleClient) private googleClient: GoogleClient,
    @inject(UserHashCredentialsService)
    private userHashCredentialsService: UserHashCredentialsService,
  ) {}

  public async getAuthUrl(browser: string): Promise<string> {
    return this.googleClient.getAuthUrl(browser);
  }

  public async exchangeAuthCode(
    code: string,
    browser: string,
  ): Promise<IInternalTokens> {
    const tokens = await this.googleClient.exchangeAuthCode(code);

    const profile = await this.googleClient.getProfile(tokens);

    let user = await UserModel.query().findOne({
      email: profile.email,
    });

    if (!user) {
      user = await UserModel.query().insert({
        email: profile.email,
        username: profile.name,
        avatar: profile.avatar,
        role: UserRole.USER,
        country: profile.locale,
      });
    }

    const providerData =
      await this.userHashCredentialsService.encryptCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
      });

    const existingCredentials =
      await UserProviderCredentialsModel.query().findOne({
        user_id: user.id,
        provider: Provider.GOOGLE,
      });

    if (existingCredentials) {
      await UserProviderCredentialsModel.query()
        .update({
          credentials: providerData,
        })
        .where({
          id: existingCredentials.id,
        });
    } else {
      await UserProviderCredentialsModel.query().insert({
        user_id: user.id,
        provider: Provider.GOOGLE,
        credentials: providerData,
      });
    }

    const internalTokens = await this.generateTokens({ user, browser });

    return internalTokens;
  }

  private async generateTokens({
    user,
    browser,
  }: {
    user: IUser;
    browser: string;
  }): Promise<IInternalTokens> {
    try {
      const payload = { id: user.id, email: user.email };
      const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES,
      } as SignOptions);

      const refreshToken = jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_SECRET!,
        {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRES,
        } as SignOptions,
      );

      const securedRefreshToken = await bcrypt.hash(
        refreshToken,
        parseInt(process.env.BCRYPT_SALT_ROUNDS || "10"),
      );

      await UserRefreshTokenModel.query()
        .where({
          user_id: user.id,
          browser: browser,
        })
        .delete();

      await UserRefreshTokenModel.query().insert({
        user_id: user.id,
        browser: browser,
        token: securedRefreshToken,
      });

      return Promise.resolve({ accessToken, refreshToken });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async signUp({
    email,
    username,
    password,
    browser,
    country,
  }: {
    email: string;
    username: string;
    password: string;
    country?: string;
    browser: string;
  }): Promise<IInternalTokens> {
    let user = await UserModel.query().findOne({
      email,
    });

    if (user) {
      throw new AppError(403, "You have already registered");
    }

    user = await UserModel.query().insert({
      email,
      username,
      role: UserRole.USER,
      country,
    });

    const hashPassword = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_SALT_ROUNDS || "10"),
    );

    const providerData = {
      password: hashPassword,
    };

    await UserProviderCredentialsModel.query().insert({
      user_id: user.id,
      provider: Provider.LOCAL,
      credentials: providerData,
    });

    const internalTokens = await this.generateTokens({ user, browser });

    return internalTokens;
  }

  public async login({
    email,
    password,
    browser,
  }: {
    email: string;
    password: string;
    browser: string;
  }): Promise<IInternalTokens> {
    let user = await UserModel.query().findOne({
      email,
    });

    if (!user) {
      throw new AppError(404, "No user found");
    }

    const credentials = await UserProviderCredentialsModel.query().findOne({
      user_id: user.id,
      provider: Provider.LOCAL,
    });

    if (!credentials || !credentials.credentials.password) {
      throw new AppError(404, "No credentials found");
    }

    const compared = await bcrypt.compare(
      password,
      credentials.credentials.password,
    );

    if (!compared) {
      throw new AppError(403, "Wrong password");
    }

    const tokens = await this.generateTokens({
      user,
      browser,
    });

    return tokens;
  }

  public async refreshTokens({
    token,
    userId,
    browser,
  }: {
    token: string;
    userId: number;
    browser: string;
  }): Promise<IInternalTokens> {
    const user = await UserModel.query().findOne({
      id: userId,
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const refreshToken = await UserRefreshTokenModel.query()
      .findOne({
        user_id: user.id,
        browser,
      })
      .first();

    if (!refreshToken) {
      throw new AppError(404, "Refresh token not found");
    }

    const isMatch = await bcrypt.compare(token, refreshToken.token);

    if (!isMatch) {
      throw new AppError(403, "Invalid refresh token");
    }

    const newTokens = await this.generateTokens({ user, browser });

    return newTokens;
  }

  public async refreshExternalTokens(userId: number): Promise<void> {
    const user = await UserModel.query().findOne({
      id: userId,
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const providerCredentials =
      await UserProviderCredentialsModel.query().findOne({
        user_id: user.id,
        provider: Provider.GOOGLE,
      });

    if (!providerCredentials) {
      throw new AppError(404, "No provider credentials found");
    }

    const decryptedCredentials =
      await this.userHashCredentialsService.decryptCredentials(
        providerCredentials.credentials,
      );

    if (!decryptedCredentials.refresh_token) {
      throw new AppError(400, "No refresh token found");
    }

    const updatedCreds = await this.googleClient.refreshToken(
      decryptedCredentials.refresh_token,
    );

    const encryptedCredentials =
      await this.userHashCredentialsService.encryptCredentials({
        access_token: updatedCreds.access_token,
        refresh_token:
          updatedCreds.refresh_token || decryptedCredentials.refresh_token,
        scope: updatedCreds.scope,
        token_type: updatedCreds.token_type,
        expiry_date: updatedCreds.expiry_date,
      });

    await providerCredentials.$query().patch({
      credentials: encryptedCredentials,
    });
  }

  public async logout({
    userId,
    browser,
  }: {
    userId: number;
    browser: string;
  }): Promise<void> {
    if (!userId) {
      throw new AppError(401, "Unauthorized");
    }

    await UserRefreshTokenModel.query()
      .where({
        user_id: userId,
      })
      .andWhere({
        browser,
      })
      .delete();
  }
}
