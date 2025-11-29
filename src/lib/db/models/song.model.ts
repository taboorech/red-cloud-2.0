import Model from "../knex-objection";
import { SongAuthorsModel } from "./song-authors.model";

interface ISongMetadata {
  release_year?: number;
}

export interface ISong {
  id: number;
  title: string;
  description?: string;
  text?: string;
  language?: string;
  duration_seconds: number;
  url: string;
  image_url?: string;
  is_active: boolean;
  metadata?: ISongMetadata;
  authors?: SongAuthorsModel[];

  // Field when fetching user's songs
  roles?: string[];
}

export class SongModel extends Model implements ISong {
  static tableName = "songs";

  id!: number;
  title!: string;
  description?: string;
  text?: string;
  language?: string;
  duration_seconds!: number;
  url!: string;
  image_url?: string;
  is_active!: boolean;
  metadata?: ISongMetadata;
  authors?: SongAuthorsModel[];

  roles?: string[];

  static get relationMappings() {
    return {
      authors: {
        relation: Model.HasManyRelation,
        modelClass: SongAuthorsModel,
        join: {
          from: `${this.tableName}.id`,
          to: `${SongAuthorsModel.tableName}.song_id`,
        },
      },
    };
  }
}
