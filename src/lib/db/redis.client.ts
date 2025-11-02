import { Redis } from "ioredis";
import { RedisOptions } from "ioredis";

let __client: Redis;

export function getRedisConnectionOptions(): RedisOptions {
  return {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 3,
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

export function redis(): Redis {
  if (!__client) {
    __client = new Redis(getRedisConnectionOptions());
  }
  return __client;
}
