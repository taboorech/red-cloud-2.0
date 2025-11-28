import { queue } from "../../lib/queue/subscription.queue";
import { logger } from "../../lib/logger";

export async function initializeSubscriptionJobs(): Promise<void> {
  try {
    // Schedule cleanup of expired subscriptions - runs every hour
    await queue.add(
      "cleanup-expired",
      { type: "cleanup-expired" },
      {
        repeat: {
          pattern: "0 * * * *", // Every hour
        },
        jobId: "cleanup-expired-subscriptions",
      },
    );

    // Schedule cleanup of expired trial subscriptions - runs every 6 hours
    await queue.add(
      "cleanup-expired-trial",
      { type: "cleanup-expired-trial" },
      {
        repeat: {
          pattern: "0 */6 * * *", // Every 6 hours
        },
        jobId: "cleanup-expired-trial",
      },
    );

    logger().info("Subscription cleanup jobs initialized successfully");
  } catch (error) {
    logger().error("Failed to initialize subscription jobs:", error);
    throw error;
  }
}
