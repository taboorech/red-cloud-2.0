import Model from "../knex-objection";
import { UserBansModel } from "./user-bans.model";
import { UserProviderCredentialsModel } from "./user-provider-credentials.model";
import { UserRefreshTokenModel } from "./user-refresh-token.model";

export interface IUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
}

export class UserModel extends Model implements IUser {
  static tableName = "users";

  id!: string;
  username!: string;
  email!: string;
  avatar?: string;
  role!: string;

  static relationMappings = {
    userProviderCredentials: {
      relation: Model.HasManyRelation,
      modelClass: UserProviderCredentialsModel,
      join: {
        from: "users.id",
        to: "user_provider_credentials.userId",
      },
    },
    userRefreshTokens: {
      relation: Model.HasManyRelation,
      modelClass: UserRefreshTokenModel,
      join: {
        from: "users.id",
        to: "user_refresh_tokens.userId",
      },
    },
    userBans: {
      relation: Model.HasManyRelation,
      modelClass: UserBansModel,
      join: {
        from: "users.id",
        to: "user_bans.userId",
      },
    },
  };
}
