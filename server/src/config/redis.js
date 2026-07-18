import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error({ err }, 'Redis error'));

export async function connectRedis() {
  if (redis.status === 'ready' || redis.status === 'connecting') return redis;
  await redis.connect();
  return redis;
}

export async function disconnectRedis() {
  await redis.quit();
  logger.info('Redis connection closed');
}
