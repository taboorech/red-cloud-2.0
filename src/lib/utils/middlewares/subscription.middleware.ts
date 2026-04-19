import { Request, Response, NextFunction } from "express";
import { AppError } from "@app/lib/errors/app.error";
import { UserSubscriptionPlanModel } from "@models/user-subscription-plan.model";
import {
  SubscriptionStatus,
  subscriptionPlanTypeToId,
  SubscriptionPlanType,
} from "@app/lib/constants/payment";

const requireSubscription = (...planTypes: SubscriptionPlanType[]) => {
  const plans = planTypes.length ? planTypes : [SubscriptionPlanType.PREMIUM];

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(401, "Unauthorized");
      }

      const planIds = plans.map((p) => subscriptionPlanTypeToId[p]);

      const subscription = await UserSubscriptionPlanModel.query()
        .where("user_id", userId)
        .whereIn("subscription_plan_id", planIds)
        .whereIn("status", [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIALING,
        ])
        .first();

      if (!subscription) {
        throw new AppError(403, "This feature requires an active subscription");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export { requireSubscription };
