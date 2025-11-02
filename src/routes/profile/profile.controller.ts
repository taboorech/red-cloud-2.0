import ProfileService from "@app/lib/services/profile.service";
import {
  changeUserPasswordValidation,
  getProfileValidation,
} from "@app/lib/validation/profile.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export default class ProfileController {
  constructor(@inject(ProfileService) private profileService: ProfileService) {
    this.getProfile = this.getProfile.bind(this);
    this.changeUserPassword = this.changeUserPassword.bind(this);
  }

  public async getProfile(req: Request, res: Response) {
    const { userId } = getProfileValidation.parse({ userId: req.user?.id });

    const user = await this.profileService.getProfile(userId);

    res.json({
      status: "OK",
      data: user,
    });
  }

  public async changeUserPassword(req: Request, res: Response) {
    const parsed = changeUserPasswordValidation.parse({
      ...req.body,
      userId: req.user?.id,
    });

    await this.profileService.changeUserPassword(parsed);

    res.json({
      status: "OK",
    });
  }
}
