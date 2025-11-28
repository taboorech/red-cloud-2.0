import { SubscriptionPlanModel } from "./subscription-plan.model";
import Model from "../knex-objection";
import { PaymentInterval } from "@app/lib/constants/payment";

export interface ISubscriptionPlanPrice {
  id: number;
  subscription_plan_id: number;
  stripe_price_id: string;
  currency: string;
  amount: number;
  billing_interval: PaymentInterval;
}

export class SubscriptionPlanPriceModel
  extends Model
  implements ISubscriptionPlanPrice
{
  static tableName = "subscription_plan_prices";

  id!: number;
  subscription_plan_id!: number;
  stripe_price_id!: string;
  currency!: string;
  amount!: number;
  billing_interval!: PaymentInterval;

  static relationMappings = {
    subscription_plan: {
      relation: Model.BelongsToOneRelation,
      modelClass: SubscriptionPlanModel,
      join: {
        from: `subscription_plan_prices.subscription_plan_id`,
        to: `subscription_plans.id`,
      },
    },
  };
}
