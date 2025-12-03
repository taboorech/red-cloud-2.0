import Model from "../knex-objection";
import { PlaylistItemModel } from "./playlist-item.model";
import { SongModel } from "./song.model";
import { UserModel } from "./user.model";

export interface IPlaylist {
  id: number;
  title: string;
  owner_id: number;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PlaylistModel extends Model implements IPlaylist {
  static tableName = "playlists";

  id!: number;
  title!: string;
  owner_id!: number;
  is_public!: boolean;
  created_at!: Date;
  updated_at!: Date;

  static relationMappings = {
    songs: {
      relation: Model.ManyToManyRelation,
      modelClass: SongModel,
      join: {
        from: `${this.tableName}.id`,
        through: {
          from: `${PlaylistItemModel.tableName}.playlist_id`,
          to: `${PlaylistItemModel.tableName}.song_id`,
        },
        to: `${SongModel.tableName}.id`,
      },
    },
    owner: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserModel,
      join: {
        from: `${this.tableName}.owner_id`,
        to: `${UserModel.tableName}.id`,
      },
    },
  };
}
