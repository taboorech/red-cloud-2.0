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

const getRedisKeys = async ({
  group,
  pattern,
}: {
  group: RedisKeyGroup;
  pattern: string;
}): Promise<string[]> => {
  return redis().keys(`${group}:${pattern}`);
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

const removeRedisKeys = async ({
  group,
  pattern,
}: {
  group: RedisKeyGroup;
  pattern: string;
}) => {
  const keys = await getRedisKeys({ group, pattern });
  if (keys.length === 0) {
    return;
  }

  await redis().del(keys);
};

export const RedisUtils = {
  setRedisKey,
  getRedisKey,
  getRedisKeys,
  removeRedisKey,
  removeRedisKeys,
};
