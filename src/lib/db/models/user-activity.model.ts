import Model from "../knex-objection";
import { UserModel } from "./user.model";

export enum ContentType {
  COVER_GENERATION = "cover_generation",
  LYRICS_TRANSCRIPTION = "lyrics_transcription",
}

export interface IUserActivityMetadata {
  objectId?: string;
  model: string;
  provider: string;
  prompt?: string;
  audioSource?: "url" | "upload";
  textLength?: number;
}

export interface IUserActivity {
  id: number;
  user_id: number;
  content_type: ContentType;
  result?: string;
  input_tokens?: number;
  output_tokens?: number;
  cost?: number;
  metadata?: IUserActivityMetadata;
  created_at: Date;
  updated_at: Date;
}

export class UserActivityModel extends Model implements IUserActivity {
  static tableName = "user_activities";

  id!: number;
  user_id!: number;
  content_type!: ContentType;
  result?: string;
  input_tokens?: number;
  output_tokens?: number;
  cost?: number;
  metadata?: IUserActivityMetadata;
  created_at!: Date;
  updated_at!: Date;

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
