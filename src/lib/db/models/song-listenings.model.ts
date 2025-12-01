import Model from "../knex-objection";
import { SongModel } from "./song.model";
import { UserModel } from "./user.model";

export interface ISongListenings {
  id: number;
  song_id: number;
  user_id: number;
  listened_at: Date;
}

export class SongListeningsModel extends Model implements ISongListenings {
  static tableName = "song_listenings";

  id!: number;
  song_id!: number;
  user_id!: number;
  listened_at!: Date;

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
