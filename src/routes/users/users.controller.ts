import ProfileService from "@app/lib/services/profile.service";
import UsersService from "@app/lib/services/users.service";
import { UserModel } from "@app/lib/db/models/user.model";
import { UserBansModel } from "@app/lib/db/models/user-bans.model";
import { userIdValidation } from "@app/lib/validation/main.scheme";
import {
  changeUserAccessValidation,
  getAllUsersValidation,
  giftSubscriptionValidation,
  setUserSubscriptionValidation,
  updateUserRoleValidation,
} from "@app/lib/validation/users.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export default class UsersController {
  constructor(
    @inject(UsersService) private usersService: UsersService,
    @inject(ProfileService) private profileService: ProfileService,
  ) {
    this.getUser = this.getUser.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.updateUserRole = this.updateUserRole.bind(this);
    this.changeUserAccess = this.changeUserAccess.bind(this);
    this.setUserSubscription = this.setUserSubscription.bind(this);
    this.giftSubscription = this.giftSubscription.bind(this);
  }

  public async getUser(req: Request, res: Response) {
    const { userId } = userIdValidation.parse(req.params);

    const profile = await this.profileService.getProfile({
      userId,
      withSongs: true,
    });

    res.json({
      status: "OK",
      data: profile,
    });
  }

  public async getAllUsers(req: Request, res: Response) {
    const parsed = getAllUsersValidation.parse(req.query);
    const users = await this.usersService.getAllUsers(parsed);
    const subscriptions = await this.usersService.getActiveSubscriptionMap(
      users.map((u) => Number(u.id)),
    );

    const data = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
      country: u.country,
      userBans: (u as UserModel & { userBans?: UserBansModel[] }).userBans,
      subscription: subscriptions.get(Number(u.id)),
    }));

    res.json({
      status: "OK",
      data,
    });
  }

  public async updateUserRole(req: Request, res: Response) {
    const parsed = updateUserRoleValidation.parse({
      ...req.query,
      ...req.body,
    });

    await this.usersService.updateUserRole(parsed);

    res.json({
      status: "OK",
    });
  }

  public async changeUserAccess(req: Request, res: Response) {
    const parse = changeUserAccessValidation.parse({
      ...req.query,
      ...req.body,
    });

    await this.usersService.changeUserAccess(parse);

    res.json({
      status: "OK",
    });
  }

  public async setUserSubscription(req: Request, res: Response) {
    const parsed = setUserSubscriptionValidation.parse({
      ...req.params,
      ...req.body,
    });

    await this.usersService.setUserSubscription(parsed, req.user!.id);

    res.json({ status: "OK" });
  }

  public async giftSubscription(req: Request, res: Response) {
    const parsed = giftSubscriptionValidation.parse({
      ...req.params,
      ...req.body,
    });

    await this.usersService.giftSubscription(parsed, req.user!.id);

    res.json({ status: "OK" });
  }
}
