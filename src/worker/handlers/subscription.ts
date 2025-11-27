import {
  SubscriptionPlanType,
  subscriptionPlanTypeToId,
  SubscriptionStatus,
} from "@app/lib/constants/payment";
import { UserSubscriptionPlanModel } from "@app/lib/db/models/user-subscription-plan.model";
import { logger } from "@app/lib/logger";
import dayjs from "dayjs";

async function updateUserSubscriptionStatus(
  subscription: UserSubscriptionPlanModel,
): Promise<void> {
  await UserSubscriptionPlanModel.query()
    .patch({ status: SubscriptionStatus.CANCELED })
    .where("id", subscription.id);

  const userFreeSubscription = await UserSubscriptionPlanModel.query().findOne({
    user_id: subscription.user_id,
    subscription_plan_id: subscriptionPlanTypeToId[SubscriptionPlanType.FREE],
  });

  if (!userFreeSubscription) {
    await UserSubscriptionPlanModel.query().insert({
      user_id: subscription.user_id,
      subscription_plan_id: subscriptionPlanTypeToId[SubscriptionPlanType.FREE],
      started_at: new Date(),
      status: SubscriptionStatus.ACTIVE,
      stripe_subscription_id: null,
      current_period_start: null,
      current_period_end: null,
      trial_ends_at: null,
    });
  }

  await userFreeSubscription!
    .$query()
    .patch({ status: SubscriptionStatus.ACTIVE });
}

async function cleanupExpiredSubscriptions(): Promise<void> {
  const now = dayjs().toDate();

  const expiredSubscriptions = await UserSubscriptionPlanModel.query()
    .where("current_period_end", "<", now)
    .whereNull("trial_ends_at");

  logger().info(
    `Found ${expiredSubscriptions.length} expired subscriptions to update`,
  );

  const results = await Promise.allSettled(
    expiredSubscriptions.map(async (subscription) => {
      await updateUserSubscriptionStatus(subscription);

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

async function cleanupExpiredTrial(): Promise<void> {
  const now = dayjs().toDate();

  const expiredTrials = await UserSubscriptionPlanModel.query()
    .whereNotNull("trial_ends_at")
    .where("trial_ends_at", "<", now);

  logger().info(`Found ${expiredTrials.length} expired trial subscriptions`);

  const results = await Promise.allSettled(
    expiredTrials.map(async (subscription) => {
      await updateUserSubscriptionStatus(subscription);

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

export { cleanupExpiredSubscriptions, cleanupExpiredTrial };
