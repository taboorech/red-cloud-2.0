import Model from "../knex-objection";

export type VisibilityLevel = "everyone" | "friends" | "nobody";

export const VISIBILITY_VALUES: VisibilityLevel[] = [
  "everyone",
  "friends",
  "nobody",
];

export interface IUserPrivacySettings {
  id: number;
  user_id: number;
  listening_visibility: VisibilityLevel;
  presence_visibility: VisibilityLevel;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_PRIVACY_SETTINGS: Omit<
  IUserPrivacySettings,
  "id" | "user_id"
> = {
  listening_visibility: "friends",
  presence_visibility: "friends",
};

export class UserPrivacySettingsModel
  extends Model
  implements IUserPrivacySettings
{
  static tableName = "user_privacy_settings";

  id!: number;
  user_id!: number;
  listening_visibility!: VisibilityLevel;
  presence_visibility!: VisibilityLevel;
  created_at?: string;
  updated_at?: string;
}
