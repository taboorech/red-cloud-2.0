import { SongAuthorsRole } from "@app/lib/constants/song";
import Model from "../knex-objection";
import { UserModel } from "./user.model";

export interface ISongAuthors {
  id: number;
  user_id: number;
  song_id: number;
  role: SongAuthorsRole;
  created_at: string;
  updated_at: string;
}

export class SongAuthorsModel extends Model implements ISongAuthors {
  static tableName = "song_authors";

  id!: number;
  user_id!: number;
  song_id!: number;
  role!: SongAuthorsRole;
  created_at!: string;
  updated_at!: string;

  static get relationMappings() {
    return {
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
}
