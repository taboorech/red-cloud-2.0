import { injectable } from "inversify";
import { redis } from "../db/redis.client";

@injectable()
export class OnlineService {
  private readonly ONLINE_USERS_KEY = "online_users";
  private readonly USER_HEARTBEAT_KEY = "user_heartbeat";
  private readonly HEARTBEAT_EXPIRY = 30;

  constructor() {}

  public async setUserOnline(userId: string): Promise<void> {
    const redisClient = redis();
    await redisClient.sadd(this.ONLINE_USERS_KEY, userId);
    await redisClient.setex(`${this.USER_HEARTBEAT_KEY}:${userId}`, this.HEARTBEAT_EXPIRY, Date.now().toString());
  }

  public async setUserOffline(userId: string): Promise<void> {
    const redisClient = redis();
    await redisClient.srem(this.ONLINE_USERS_KEY, userId);
    await redisClient.del(`${this.USER_HEARTBEAT_KEY}:${userId}`);
  }

  public async isUserOnline(userId: string): Promise<boolean> {
    const redisClient = redis();
    const exists = await redisClient.exists(`${this.USER_HEARTBEAT_KEY}:${userId}`);
    return exists === 1;
  }

  public async getOnlineUsers(): Promise<string[]> {
    const redisClient = redis();
    return await redisClient.smembers(this.ONLINE_USERS_KEY);
  }

  public async getOnlineStatus(userIds: string[]): Promise<Record<string, boolean>> {
    const redisClient = redis();
    const pipeline = redisClient.pipeline();
    
    userIds.forEach(userId => {
      pipeline.exists(`${this.USER_HEARTBEAT_KEY}:${userId}`);
    });

    const results = await pipeline.exec();
    const onlineStatus: Record<string, boolean> = {};

    userIds.forEach((userId, index) => {
      onlineStatus[userId] = results?.[index]?.[1] === 1;
    });

    return onlineStatus;
  }

  public async updateHeartbeat(userId: string): Promise<void> {
    const redisClient = redis();
    await redisClient.setex(`${this.USER_HEARTBEAT_KEY}:${userId}`, this.HEARTBEAT_EXPIRY, Date.now().toString());
  }

  public async cleanupOfflineUsers(): Promise<void> {
    const redisClient = redis();
    const onlineUsers = await redisClient.smembers(this.ONLINE_USERS_KEY);
    
    for (const userId of onlineUsers) {
      const exists = await redisClient.exists(`${this.USER_HEARTBEAT_KEY}:${userId}`);
      if (exists === 0) {
        await redisClient.srem(this.ONLINE_USERS_KEY, userId);
      }
    }
  }
}