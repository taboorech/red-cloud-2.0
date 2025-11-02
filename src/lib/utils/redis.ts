import { redis } from "../db/redis.client";

export enum RedisKeyGroup {
  APP = "app",
}

const setRedisKey = async ({
  group,
  key,
  value,
  ttl,
}: {
  group: RedisKeyGroup;
  key: string;
  value: string;
  ttl?: number;
}) => {
  if (ttl) {
    await redis().set(`${group}:${key}`, value, "EX", ttl);
    return;
  }
  await redis().set(`${group}:${key}`, value);
};

const getRedisKey = async ({
  group,
  key,
}: {
  group: RedisKeyGroup;
  key: string;
}): Promise<string | null> => {
  return redis().get(`${group}:${key}`);
};

const removeRedisKey = async ({
  group,
  key,
}: {
  group: RedisKeyGroup;
  key: string;
}) => {
  await redis().del(`${group}:${key}`);
};

export const RedisUtils = {
  setRedisKey,
  getRedisKey,
  removeRedisKey,
};
