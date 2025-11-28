import { SubscriptionStatus } from "@app/lib/constants/payment";
import { UserSubscriptionPlanModel } from "@app/lib/db/models/user-subscription-plan.model";
import { logger } from "@app/lib/logger";
import { PaymentService } from "@app/lib/services/payment.service";
import dayjs from "dayjs";
import { inject, injectable } from "inversify";

@injectable()
export class SubscriptionJobHandler {
  constructor(@inject(PaymentService) private paymentService: PaymentService) {}

  public async cleanupExpiredSubscriptions(): Promise<void> {
    const now = dayjs().toDate();

    const expiredSubscriptions = await UserSubscriptionPlanModel.query()
      .where("current_period_end", "<", now)
      .andWhere("status", SubscriptionStatus.ACTIVE)
      .whereNull("trial_ends_at");

    logger().info(
      `Found ${expiredSubscriptions.length} expired subscriptions to update`,
    );

    const results = await Promise.allSettled(
      expiredSubscriptions.map(async (subscription) => {
        await this.paymentService.cancelSubscription(subscription.user_id);

        logger().info(
          `Updated expired subscription ${subscription.id} for user ${subscription.user_id}`,
        );
      }),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        logger().error("Error updating expired subscription:", result.reason);
      }
    }
  }

  public async cleanupExpiredTrial(): Promise<void> {
    const now = dayjs().toDate();

    const expiredTrials = await UserSubscriptionPlanModel.query()
      .whereNotNull("trial_ends_at")
      .andWhere("status", SubscriptionStatus.TRIALING)
      .where("trial_ends_at", "<", now);

    logger().info(`Found ${expiredTrials.length} expired trial subscriptions`);

    const results = await Promise.allSettled(
      expiredTrials.map(async (subscription) => {
        await this.paymentService.cancelSubscription(subscription.user_id);

        logger().info(
          `Updated expired trial subscription ${subscription.id} for user ${subscription.user_id}`,
        );
      }),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        logger().error(
          "Error updating expired trial subscription:",
          result.reason,
        );
      }
    }
  }
}
