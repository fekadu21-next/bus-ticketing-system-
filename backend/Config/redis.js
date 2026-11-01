import Redis from 'ioredis';
import env from './env.js';

let isRedisConnected = false;
let redisClient = null;

try {
  const redisUrl = env.redisUrl || 'redis://127.0.0.1:6379';

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Critical requirement for BullMQ
    enableReadyCheck: true,
    connectTimeout: 5000,
    retryStrategy(times) {
      // In development or test environments, avoid infinite spamming if Redis server is not started locally
      if (times > 5 && process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  [REDIS] Local Redis server not reachable. Running in resilient offline fallback mode.');
        return null;
      }
      return Math.min(times * 300, 3000);
    },
  });

  redisClient.on('connect', () => {
    // Socket connected
  });

  redisClient.on('ready', () => {
    isRedisConnected = true;
    console.log('⚡ [REDIS] Connected and ready.');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    // Suppress unhandled crash - log warning once
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️  [REDIS ERROR]', err.message || err);
    }
  });

  redisClient.on('close', () => {
    isRedisConnected = false;
  });

  redisClient.on('end', () => {
    isRedisConnected = false;
  });
} catch (error) {
  console.warn('⚠️  [REDIS INIT WARNING] Could not initialize Redis client:', error.message);
  isRedisConnected = false;
  redisClient = null;
}

/**
 * Returns whether Redis is actively connected and accepting commands
 */
export function isRedisAvailable() {
  return Boolean(isRedisConnected && redisClient && redisClient.status === 'ready');
}

/**
 * Safe Get from Redis
 */
export async function redisGet(key) {
  if (!isRedisAvailable()) return null;
  try {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch (err) {
    console.warn(`[REDIS] get(${key}) error:`, err.message);
    return null;
  }
}

/**
 * Safe Set in Redis with optional TTL in seconds
 */
export async function redisSet(key, value, ttlSeconds = null) {
  if (!isRedisAvailable()) return false;
  try {
    const payload = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redisClient.set(key, payload, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, payload);
    }
    return true;
  } catch (err) {
    console.warn(`[REDIS] set(${key}) error:`, err.message);
    return false;
  }
}

/**
 * Safe Delete key(s) from Redis
 */
export async function redisDel(key) {
  if (!isRedisAvailable()) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    console.warn(`[REDIS] del(${key}) error:`, err.message);
    return false;
  }
}

/**
 * Safe Atomic Distributed Lock (SET NX EX)
 * Returns true if the lock was acquired, false otherwise
 */
export async function redisSetNx(key, value, ttlSeconds = 600) {
  if (!isRedisAvailable()) return false;
  try {
    const payload = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const result = await redisClient.set(key, payload, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } catch (err) {
    console.warn(`[REDIS] setNx(${key}) error:`, err.message);
    return false;
  }
}

/**
 * Graceful Redis shutdown
 */
export async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    }
    isRedisConnected = false;
  }
}

export { redisClient };
export default {
  redisClient,
  isRedisAvailable,
  redisGet,
  redisSet,
  redisDel,
  redisSetNx,
  closeRedis,
};
