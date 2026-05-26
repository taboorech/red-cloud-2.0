import { redis } from "../db/redis.client";
import { logger } from "../logger";

export const PRIVACY_EVENTS_CHANNEL = "privacy-events";

export interface PrivacyChangedEvent {
  type: "privacy-changed";
  userId: number;
}

export async function publishPrivacyChange(userId: number): Promise<void> {
  const payload: PrivacyChangedEvent = { type: "privacy-changed", userId };
  const receivers = await redis().publish(
    PRIVACY_EVENTS_CHANNEL,
    JSON.stringify(payload),
  );
  logger().info(
    `[PRIVACY PUBLISH] user=${userId} delivered to ${receivers} subscriber(s)`,
  );
}
