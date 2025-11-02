import { ICredentials } from "@app/lib/types/credentials";
import Model from "../knex-objection";
import { UserModel } from "./user.model";

export interface IUserProviderCredentials {
  id: string;
  user_id: string;
  provider: string;
  credentials: ICredentials;
}

export class UserProviderCredentialsModel
  extends Model
  implements IUserProviderCredentials
{
  static tableName = "user_provider_credentials";

  id!: string;
  user_id!: string;
  provider!: string;
  credentials!: ICredentials;

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserModel,
      join: { from: "user_provider_credentials.user_id", to: "users.id" },
    },
  };
}
