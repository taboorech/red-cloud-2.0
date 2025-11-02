import UsersService from "@app/lib/services/users.service";
import {
  changeUserAccessValidation,
  getAllUsersValidation,
  updateUserRoleValidation,
} from "@app/lib/validation/users.scheme";
import { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export default class UsersController {
  constructor(@inject(UsersService) private usersService: UsersService) {
    this.getAllUsers = this.getAllUsers.bind(this);
    this.updateUserRole = this.updateUserRole.bind(this);
    this.changeUserAccess = this.changeUserAccess.bind(this);
  }

  public async getAllUsers(req: Request, res: Response) {
    const parsed = getAllUsersValidation.parse(req.query);
    const users = await this.usersService.getAllUsers(parsed);

    res.json({
      status: "OK",
      data: users,
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
}
