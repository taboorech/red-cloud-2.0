import Model from "../knex-objection";
import { SongModel } from "./song.model";

export interface ISongEmbedding {
  id: number;
  song_id: number;
  embedding: number[];
  model: string;
  created_at: Date;
  updated_at: Date;
}

export class SongEmbeddingModel extends Model implements ISongEmbedding {
  static tableName = "song_embeddings";

  id!: number;
  song_id!: number;
  embedding!: number[];
  model!: string;
  created_at!: Date;
  updated_at!: Date;

  song?: SongModel;

  static relationMappings = {
    song: {
      relation: Model.BelongsToOneRelation,
      modelClass: SongModel,
      join: {
        from: `${this.tableName}.song_id`,
        to: `${SongModel.tableName}.id`,
      },
    },
  };
}
