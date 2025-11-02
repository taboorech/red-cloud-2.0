import { browserHeader } from "@app/lib/constants/app";
import { AuthService } from "@app/lib/services/auth.service";
import {
  exchangeCodeValidation,
  getAuthUrlValidation,
  loginValidation,
  logoutValidation,
  refreshTokensValidation,
  signUpValidation,
} from "@app/lib/validation/auth.scheme";
import { userIdValidation } from "@app/lib/validation/main.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export default class AuthController {
  constructor(@inject(AuthService) private authService: AuthService) {
    this.getAuthUrl = this.getAuthUrl.bind(this);
    this.exchangeAuthCode = this.exchangeAuthCode.bind(this);
    this.signUp = this.signUp.bind(this);
    this.login = this.login.bind(this);
    this.refreshTokens = this.refreshTokens.bind(this);
    this.logout = this.logout.bind(this);
  }

  public async getAuthUrl(req: Request, res: Response) {
    const { [browserHeader]: browser } = getAuthUrlValidation.parse(
      req.headers,
    );

    const url = await this.authService.getAuthUrl(browser);

    res.json({
      status: "OK",
      data: url,
    });
  }

  public async exchangeAuthCode(req: Request, res: Response) {
    const { code, state } = exchangeCodeValidation.parse(req.query);

    const { accessToken, refreshToken } =
      await this.authService.exchangeAuthCode(code, state);

    res.redirect(
      `${process.env.UI_HOST_URL}${process.env.UI_EXTERNAL_PROVIDER_CALLBACK_PATH}?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );
  }

  public async signUp(req: Request, res: Response) {
    const { [browserHeader]: browser, ...parse } = signUpValidation.parse({
      ...req.headers,
      ...req.body,
    });

    const creds = await this.authService.signUp({ ...parse, browser });

    res.json({
      status: "OK",
      data: creds,
    });
  }

  public async login(req: Request, res: Response) {
    const { [browserHeader]: browser, ...parse } = loginValidation.parse({
      ...req.headers,
      ...req.body,
    });

    const creds = await this.authService.login({ ...parse, browser });

    res.json({
      status: "OK",
      data: creds,
    });
  }

  public refreshTokens = async (req: Request, res: Response): Promise<void> => {
    const {
      authorization: authHeader,
      userId,
      [browserHeader]: browser,
    } = refreshTokensValidation.parse({ ...req.headers, userId: req.user?.id });

    const token = authHeader!.replace("Bearer ", "");

    const tokens = await this.authService.refreshTokens({
      token,
      userId,
      browser,
    });
    res.json({
      status: "OK",
      data: tokens,
    });
  };

  public async refreshExternalTokens(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { userId } = userIdValidation.parse({ userId: req.user?.id });
    await this.authService.refreshExternalTokens(userId);

    res.json({
      status: "OK",
    });
  }

  public async logout(req: Request, res: Response): Promise<void> {
    const { userId, [browserHeader]: browser } = logoutValidation.parse({
      ...req.headers,
      userId: req.user?.id,
    });
    await this.authService.logout({ userId, browser });

    res.json({
      status: "OK",
    });
  }
}
