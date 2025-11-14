import Model from "../knex-objection";
import { SubscriptionPlanPriceModel } from "./subscription-plan-price.model";
import { UserSubscriptionPlanModel } from "./user-subscription-plan.model";
import { UserModel } from "./user.model";

export interface ISubscriptionPlan {
  id: number;
  title: string;
  description: string;
  stripe_price_id: string;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
}

export class SubscriptionPlanModel extends Model implements ISubscriptionPlan {
  static tableName = "subscription_plans";

  id!: number;
  title!: string;
  description!: string;
  stripe_price_id!: string;
  is_active!: boolean;
  is_public!: boolean;
  sort_order!: number;

  static relationMappings = {
    prices: {
      relation: Model.HasManyRelation,
      modelClass: SubscriptionPlanPriceModel,
      join: {
        from: `${this.tableName}.id`,
        to: `${SubscriptionPlanPriceModel.tableName}.subscription_plan_id`,
      },
    },
    users: {
      relation: Model.HasManyRelation,
      modelClass: UserModel,
      join: {
        from: `${SubscriptionPlanModel.tableName}.id`,
        through: {
          modelClass: UserSubscriptionPlanModel,
          from: `${UserSubscriptionPlanModel.tableName}.subscription_plan_id`,
          to: `${UserSubscriptionPlanModel.tableName}.user_id`,
        },
        to: `${UserModel.tableName}.id`,
      },
    },
  };
}
