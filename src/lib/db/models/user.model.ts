import Model from "../knex-objection";
import { UserBansModel } from "./user-bans.model";
import { UserProviderCredentialsModel } from "./user-provider-credentials.model";
import { UserRefreshTokenModel } from "./user-refresh-token.model";
import { UserSubscriptionPlanModel } from "./user-subscription-plan.model";

export interface IUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  subscription?: UserSubscriptionPlanModel;
}

export class UserModel extends Model implements IUser {
  static tableName = "users";

  id!: string;
  username!: string;
  email!: string;
  avatar?: string;
  role!: string;
  subscription?: UserSubscriptionPlanModel;

  static relationMappings = {
    userProviderCredentials: {
      relation: Model.HasManyRelation,
      modelClass: UserProviderCredentialsModel,
      join: {
        from: "users.id",
        to: "user_provider_credentials.user_id",
      },
    },
    userRefreshTokens: {
      relation: Model.HasManyRelation,
      modelClass: UserRefreshTokenModel,
      join: {
        from: "users.id",
        to: "user_refresh_tokens.user_id",
      },
    },
    userBans: {
      relation: Model.HasManyRelation,
      modelClass: UserBansModel,
      join: {
        from: "users.id",
        to: "user_bans.user_id",
      },
    },
    subscription: {
      relation: Model.HasOneRelation,
      modelClass: UserSubscriptionPlanModel,
      join: {
        from: "users.id",
        to: "user_subscription_plan.user_id",
      },
    },
  };
}
