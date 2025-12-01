import Model from "../knex-objection";
import { GenreModel } from "./genres.model";
import { SongAuthorsModel } from "./song-authors.model";
import { SongGenresModel } from "./song-genres.model";

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
  is_public: boolean;
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
  is_public!: boolean;
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
      genres: {
        relation: Model.ManyToManyRelation,
        modelClass: GenreModel,
        join: {
          from: `${this.tableName}.id`,
          through: {
            from: `${SongGenresModel.tableName}.song_id`,
            to: `${SongGenresModel.tableName}.genre_id`,
          },
          to: `${GenreModel.tableName}.id`,
        },
      },
    };
  }
}
