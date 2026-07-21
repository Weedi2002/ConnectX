import { Redis } from 'ioredis';
import { env } from '../config/env.js';

let connection = null;

/**
 * Dedicated Redis connection for BullMQ.
 * Must NOT be shared with the Socket.IO adapter (which uses its own pub/sub clients).
 * `maxRetriesPerRequest: null` is required by BullMQ for blocking commands.
 */
export function getQueueConnection() {
  if (!connection) {
    connection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return connection;
}
