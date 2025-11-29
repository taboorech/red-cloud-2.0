import { QueryBuilder } from "objection";
import Model from "../knex-objection";
import { SongAuthorsModel } from "./song-authors.model";
import { SongModel } from "./song.model";
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
  country?: string;
  subscription?: UserSubscriptionPlanModel;
  songs?: SongAuthorsModel[];
}

export class UserModel extends Model implements IUser {
  static tableName = "users";

  id!: string;
  username!: string;
  email!: string;
  avatar?: string;
  role!: string;
  country?: string;
  subscription?: UserSubscriptionPlanModel;
  songs?: SongAuthorsModel[];

  static relationMappings = {
    userProviderCredentials: {
      relation: Model.HasManyRelation,
      modelClass: UserProviderCredentialsModel,
      join: {
        from: `${this.tableName}.id`,
        to: `${UserProviderCredentialsModel.tableName}.user_id`,
      },
    },
    userRefreshTokens: {
      relation: Model.HasManyRelation,
      modelClass: UserRefreshTokenModel,
      join: {
        from: `${this.tableName}.id`,
        to: `${UserRefreshTokenModel.tableName}.user_id`,
      },
    },
    userBans: {
      relation: Model.HasManyRelation,
      modelClass: UserBansModel,
      join: {
        from: `${this.tableName}.id`,
        to: `${UserBansModel.tableName}.user_id`,
      },
    },
    subscription: {
      relation: Model.HasOneRelation,
      modelClass: UserSubscriptionPlanModel,
      join: {
        from: `${this.tableName}.id`,
        to: `${UserSubscriptionPlanModel.tableName}.user_id`,
      },
    },
    songs: {
      relation: Model.ManyToManyRelation,
      modelClass: SongModel,
      join: {
        from: `${this.tableName}.id`,
        through: {
          from: `${SongAuthorsModel.tableName}.user_id`,
          to: `${SongAuthorsModel.tableName}.song_id`,
        },
        to: `${SongModel.tableName}.id`,
      },
      modify: (qb: QueryBuilder<SongModel>) => {
        // TODO: Select title, description, image, url only
        qb.select(`${SongModel.tableName}.*`)
          .select(
            Model.raw(`
              ARRAY_AGG(DISTINCT ${SongAuthorsModel.tableName}.role) as roles
            `),
          )
          .groupBy(
            `${SongModel.tableName}.id`,
            `${SongAuthorsModel.tableName}.user_id`,
          );
      },
    },
  };
}
