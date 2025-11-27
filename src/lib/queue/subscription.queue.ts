import { Queue } from "bullmq";
import { redis } from "../db/redis.client";
import { QueueName } from "../constants/queue";

export const queue = new Queue(QueueName.DEFAULT, {
  connection: redis(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
