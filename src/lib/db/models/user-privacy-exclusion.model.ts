import Model from "../knex-objection";

export type ExclusionScope = "presence" | "listening";

export const EXCLUSION_SCOPE_VALUES: ExclusionScope[] = [
  "presence",
  "listening",
];

export interface IUserPrivacyExclusion {
  id: number;
  user_id: number;
  excluded_user_id: number;
  scope: ExclusionScope;
  created_at?: string;
  updated_at?: string;
}

export class UserPrivacyExclusionModel
  extends Model
  implements IUserPrivacyExclusion
{
  static tableName = "user_privacy_exclusions";

  id!: number;
  user_id!: number;
  excluded_user_id!: number;
  scope!: ExclusionScope;
  created_at?: string;
  updated_at?: string;
}
