import Model from "../knex-objection";
import { UserModel } from "./user.model";

export interface IUserRefreshToken {
  id: string;
  user_id: string;
  browser: string;
  token: string;
}

export class UserRefreshTokenModel extends Model implements IUserRefreshToken {
  static tableName = "user_refresh_tokens";

  id!: string;
  user_id!: string;
  browser!: string;
  token!: string;

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserModel,
      join: { from: "user_refresh_tokens.user_id", to: "users.id" },
    },
  };
}
