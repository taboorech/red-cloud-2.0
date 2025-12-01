import Model from "../knex-objection";
import { SongModel } from "./song.model";
import { UserModel } from "./user.model";

export enum SongAction {
  LIKE = "like",
  DISLIKE = "dislike",
}

export interface ISongActions {
  id: number;
  song_id: number;
  user_id: number;
  action: SongAction;
}

export class SongActionsModel extends Model implements ISongActions {
  static tableName = "song_actions";

  id!: number;
  song_id!: number;
  user_id!: number;
  action!: SongAction;

  static relationMappings = {
    song: {
      relation: Model.BelongsToOneRelation,
      modelClass: SongModel,
      join: {
        from: `${this.tableName}.song_id`,
        to: `${SongModel.tableName}.id`,
      },
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserModel,
      join: {
        from: `${this.tableName}.user_id`,
        to: `${UserModel.tableName}.id`,
      },
    },
  };
}
