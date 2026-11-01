import Redis from 'ioredis';
import env from './env.js';

let isRedisConnected = false;
let redisClient = null;
let hasLoggedOffline = false;

try {
  const redisUrl = env.redisUrl || 'redis://127.0.0.1:6379';

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Critical requirement for BullMQ
    enableReadyCheck: true,
    connectTimeout: 3000,
    retryStrategy(times) {
      // In development, stop reconnecting after 3 attempts if Redis is not running
      if (times > 2 && process.env.NODE_ENV !== 'production') {
        if (!hasLoggedOffline) {
          hasLoggedOffline = true;
          console.warn('ℹ️  [REDIS] Local Redis server not reachable at 127.0.0.1:6379. Running in resilient offline fallback mode.');
        }
        return null;
      }
      return Math.min(times * 500, 3000);
    },
  });

  redisClient.on('connect', () => {
    // Socket connected
  });

  redisClient.on('ready', () => {
    isRedisConnected = true;
    hasLoggedOffline = false;
    console.log('⚡ [REDIS] Connected and ready.');
  });

  redisClient.on('error', (err) => {
    isRedisConnected = false;
    // Suppress repeated connection refused logs when running without local Redis
    const isConnRefused = err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED');
    if (isConnRefused) {
      if (!hasLoggedOffline) {
        hasLoggedOffline = true;
        console.warn('ℹ️  [REDIS] Local Redis server not reachable at 127.0.0.1:6379. Running in resilient offline fallback mode.');
      }
    } else if (process.env.NODE_ENV !== 'test') {
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
  console.warn('ℹ️  [REDIS] Could not initialize client, running in offline fallback mode:', error.message);
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
