import Model from "../knex-objection";
import { SubscriptionPlanPriceModel } from "./subscription-plan-price.model";
import { UserSubscriptionPlanModel } from "./user-subscription-plan.model";
import { UserModel } from "./user.model";

export interface ISubscriptionPlan {
  id: number;
  title: string;
  description: string;
  stripe_product_id: string;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
}

export class SubscriptionPlanModel extends Model implements ISubscriptionPlan {
  static tableName = "subscription_plans";

  id!: number;
  title!: string;
  description!: string;
  stripe_product_id!: string;
  is_active!: boolean;
  is_public!: boolean;
  sort_order!: number;

  static relationMappings = {
    prices: {
      relation: Model.HasManyRelation,
      modelClass: SubscriptionPlanPriceModel,
      join: {
        from: `subscription_plans.id`,
        to: `subscription_plan_prices.subscription_plan_id`,
      },
    },
    users: {
      relation: Model.HasManyRelation,
      modelClass: UserModel,
      join: {
        from: `subscription_plans.id`,
        through: {
          modelClass: UserSubscriptionPlanModel,
          from: `user_subscription_plans.subscription_plan_id`,
          to: `user_subscription_plans.user_id`,
        },
        to: `user_model.id`,
      },
    },
  };
}
