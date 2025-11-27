import { Worker, Job } from "bullmq";
import { redis } from "../lib/db/redis.client";
import { logger } from "../lib/logger";
import { QueueName } from "../lib/constants/queue";
import { initializeSubscriptionJobs } from "./jobs/subscription.jobs";
import {
  cleanupExpiredSubscriptions,
  cleanupExpiredTrial,
} from "./handlers/subscription";

export const initWorker = async () => {
  await initializeSubscriptionJobs();

  const worker = new Worker(
    QueueName.DEFAULT,
    async (job: Job) => {
      try {
        switch (job.name) {
          case "cleanup-expired":
            await cleanupExpiredSubscriptions();
            break;
          case "cleanup-expired-trial":
            await cleanupExpiredTrial();
            break;
          default:
            logger().warn(`Unknown job: ${job.name}`);
        }
      } catch (error) {
        logger().error("Subscription worker error:", error);
        throw error;
      }
    },
    {
      connection: redis(),
      concurrency: 5,
    },
  );

  worker.on("completed", (job) => {
    logger().info(`Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    logger().error(`Job ${job?.id} failed with error:`, err);
  });

  worker.on("error", (err) => {
    logger().error("Worker error:", err);
  });

  return worker;
};
