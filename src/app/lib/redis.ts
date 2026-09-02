import IORedis from 'ioredis';
import { config } from '../config/index.js';

export const redis = new IORedis.default(config.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err: Error) => {
  console.error('Redis connection error:', err.message);
});

export const CACHE_TTL_SECONDS = 60 * 5;

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await redis.get(key);
    return cached ? (JSON.parse(cached) as T) : null;
  } catch {
    return null;
  }
};

export const setCache = async (key: string, value: unknown, ttl = CACHE_TTL_SECONDS) => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // cache write failures should never break the request
  }
};

export const invalidateCacheByPrefix = async (prefix: string) => {
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) {
      await redis.del(...keys);
    }
  } catch {
    // ignore
  }
};
