import { Redis } from 'ioredis';
import { env } from '../config/env.js';

/**
 * Shared Redis connection for BullMQ queues and workers.
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
});

redis.on('connect', () => {
  console.log('[Redis] Connected');
});

redis.on('error', (err: Error) => {
  console.error('[Redis] Connection error:', err.message);
});

export const bullMQConnection = {
  connection: redis,
};
