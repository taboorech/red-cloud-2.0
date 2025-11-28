import Model from "../knex-objection";

interface ISongMetadata {
  release_year?: number;
}

export interface ISong {
  id: number;
  title: string;
  language?: string;
  duration_seconds: number;
  url: string;
  metadata?: ISongMetadata;
}

export class SongModel extends Model implements ISong {
  static tableName = "songs";

  id!: number;
  title!: string;
  language?: string;
  duration_seconds!: number;
  url!: string;
  metadata?: ISongMetadata;
}
