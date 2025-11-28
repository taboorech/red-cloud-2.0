import { SubscriptionPlanModel } from "./subscription-plan.model";
import Model from "../knex-objection";
import { SubscriptionStatus } from "@app/lib/constants/payment";
import { UserModel } from "./user.model";

export interface IUserSubscriptionPlan {
  id: number;
  user_id: number;
  subscription_plan_id: number;
  started_at: Date;

  status: SubscriptionStatus;
  stripe_subscription_id: string | null;

  current_period_start: Date | null;
  current_period_end: Date | null;
  trial_ends_at: Date | null;
}

export class UserSubscriptionPlanModel
  extends Model
  implements IUserSubscriptionPlan
{
  static tableName = "user_subscription_plan";

  id!: number;
  user_id!: number;
  subscription_plan_id!: number;
  started_at!: Date;

  status!: SubscriptionStatus;
  stripe_subscription_id!: string | null;

  current_period_start!: Date | null;
  current_period_end!: Date | null;
  trial_ends_at!: Date | null;

  static relationMappings = {
    subscription_plan: {
      relation: Model.BelongsToOneRelation,
      modelClass: SubscriptionPlanModel,
      join: {
        from: `user_subscription_plan.subscription_plan_id`,
        to: `subscription_plans.id`,
      },
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserModel,
      join: {
        from: `user_subscription_plan.user_id`,
        to: `users.id`,
      },
    },
  };
}
