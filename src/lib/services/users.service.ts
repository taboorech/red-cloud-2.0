import z from "zod";
import { UserModel } from "../db/models/user.model";
import { paginationValidation } from "../validation/main.scheme";
import { injectable } from "inversify";
import {
  changeUserAccessValidation,
  updateUserRoleValidation,
} from "../validation/users.scheme";
import { UserAccess } from "../enum/user.enum";
import { UserBansModel } from "../db/models/user-bans.model";
import { AppError } from "../errors/app.error";
import dayjs from "dayjs";

@injectable()
export default class UsersService {
  constructor() {}

  public async getAllUsers({
    offset,
    limit,
    search,
    ids,
  }: z.infer<typeof paginationValidation>): Promise<UserModel[]> {
    const users = await UserModel.query()
      .modify((builder) => {
        if (ids?.length) builder.whereIn("id", ids);

        if (offset) builder.offset(offset);

        if (limit) builder.limit(limit);

        if (search)
          builder
            .whereILike("email", `%${search}%`)
            .orWhereILike("username", `%${search}%`);
      })
      .orderBy("id");

    return users;
  }

  public async updateUserRole({
    userId,
    role,
  }: z.infer<typeof updateUserRoleValidation>): Promise<void> {
    await UserModel.query()
      .update({
        role,
      })
      .where({
        id: userId,
      });
  }

  // TODO: check ban logic
  public async changeUserAccess({
    userId,
    action,
  }: z.infer<typeof changeUserAccessValidation>): Promise<void> {
    const user = await UserModel.query().findOne({
      id: userId,
    });
    if (!user) {
      throw new AppError(404, "User not found");
    }

    const banRecord = await UserBansModel.query().findOne({
      userId: user.id,
    });

    if (action === UserAccess.BAN) {
      if (banRecord && banRecord.is_banned) {
        throw new AppError(400, "User is already banned");
      }

      if (banRecord) {
        await UserBansModel.query()
          .update({
            is_banned: true,
            banned_at: dayjs().toDate(),
          })
          .where({
            id: banRecord.id,
          });
      } else {
        await UserBansModel.query().insert({
          user_id: user.id,
          is_banned: true,
          banned_at: dayjs().toDate(),
        });
      }
    } else {
      if (!banRecord || !banRecord.is_banned) {
        throw new AppError(400, "User is not banned");
      }

      await UserBansModel.query()
        .update({
          is_banned: false,
          banned_at: null,
        })
        .where({
          id: banRecord.id,
        });
    }
  }
}
