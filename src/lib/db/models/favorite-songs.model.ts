import Model from "../knex-objection";
import { SongModel } from "./song.model";
import { UserModel } from "./user.model";

export interface IFavoriteSong {
  id: number;
  song_id: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export class FavoriteSongsModel extends Model implements IFavoriteSong {
  static tableName = "favorite_songs";

  id!: number;
  song_id!: number;
  user_id!: number;
  created_at!: Date;
  updated_at!: Date;
}
