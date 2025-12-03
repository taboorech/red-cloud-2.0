import Model from "../knex-objection";

export interface IPlaylistMember {
  id: number;
  playlist_id: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export class PlaylistMembersModel extends Model implements IPlaylistMember {
  static tableName = "playlist_members";

  id!: number;
  playlist_id!: number;
  user_id!: number;
  created_at!: Date;
  updated_at!: Date;
}
