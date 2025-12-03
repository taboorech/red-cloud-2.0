import Model from "../knex-objection";

export interface IPlaylistItem {
  id: number;
  playlist_id: number;
  song_id: number;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export class PlaylistItemModel extends Model implements IPlaylistItem {
  static tableName = "playlist_items";

  id!: number;
  playlist_id!: number;
  song_id!: number;
  position!: number;
  created_at!: Date;
  updated_at!: Date;
}
