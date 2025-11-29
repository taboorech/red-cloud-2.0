import Model from "../knex-objection";

export interface ISongGenres {
  id: number;
  song_id: number;
  genre_id: number;
}

export class SongGenresModel extends Model implements ISongGenres {
  static tableName = "song_genres";

  id!: number;
  song_id!: number;
  genre_id!: number;
}
