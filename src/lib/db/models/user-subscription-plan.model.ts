import { SubscriptionPlanModel } from "./subscription-plan.model";
import Model from "../knex-objection";
import { PaymentInterval } from "@app/lib/constants/payment";
import { UserModel } from "./user.model";

export interface IUserSubscriptionPlan {
  id: number;
  user_id: number;
  subscription_plan_id: number;
  started_at: Date;
  current_period_start: Date | null;
  current_period_end: Date | null;
  trial_ends_at: Date | null;
}

export class UserSubscriptionPlanModel
  extends Model
  implements IUserSubscriptionPlan
{
  static tableName = "user_subscription_plans";

  id!: number;
  user_id!: number;
  subscription_plan_id!: number;
  started_at!: Date;
  current_period_start!: Date | null;
  current_period_end!: Date | null;
  trial_ends_at!: Date | null;

  static relationMappings = {
    subscription_plan: {
      relation: Model.BelongsToOneRelation,
      modelClass: SubscriptionPlanModel,
      join: {
        from: `${this.tableName}.subscription_plan_id`,
        to: `${SubscriptionPlanModel.tableName}.id`,
      },
    },
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
