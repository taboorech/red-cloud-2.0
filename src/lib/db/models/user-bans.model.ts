import Model from "../knex-objection";
import { UserModel } from "./user.model";

export interface IUserBan {
  id: string;
  user_id: string;
  reason: string;
  is_banned: boolean;
  banned_at: Date | null;
}

export class UserBansModel extends Model implements IUserBan {
  static tableName = "user_bans";

  id!: string;
  user_id!: string;
  reason!: string;
  is_banned!: boolean;
  banned_at!: Date | null;

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserModel,
      join: { from: "user_bans.user_id", to: "users.id" },
    },
  };
}
