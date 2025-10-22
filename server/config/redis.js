const redis = require('redis');

let redisClient = null;
let isRedisConnected = false;

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

console.log('[INFO] Connecting to Redis...');

redisClient = redis.createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.log('[ERROR] Redis max retries reached');
        return new Error('Max retries reached');
      }
      const delay = Math.min(retries * 1000, 3000);
      console.log(`[INFO] Redis reconnecting in ${delay}ms...`);
      return delay;
    }
  }
});

redisClient.on('error', (err) => {
  console.error('[ERROR] Redis Client Error:', err.message);
  isRedisConnected = false;
});

redisClient.on('connect', () => {
  console.log('[INFO] Redis client connected');
});

redisClient.on('ready', () => {
  console.log('[SUCCESS] Redis client ready');
  isRedisConnected = true;
});

redisClient.on('reconnecting', () => {
  console.log('[INFO] Redis client reconnecting...');
  isRedisConnected = false;
});

redisClient.on('end', () => {
  console.log('[INFO] Redis connection closed');
  isRedisConnected = false;
});

// Connect to Redis
redisClient.connect()
  .then(() => {
    console.log('[SUCCESS] Redis connection successful');
  })
  .catch((error) => {
    console.warn('[WARNING] Redis connection failed:', error.message);
    console.warn('[INFO] Application will continue without Redis caching');
    isRedisConnected = false;
  });


/**
 * Check if Redis is available
 */
const isRedisAvailable = () => {
  return redisClient !== null && isRedisConnected;
};

/**
 * Get Redis client
 */
const getRedisClient = () => {
  return redisClient;
};

/**
 * Cache helper functions
 */

const setCache = async (key, value, expirySeconds = 300) => {
  if (!isRedisAvailable()) {
    return false;
  }
  
  try {
    const serialized = JSON.stringify(value);
    await redisClient.setEx(key, expirySeconds, serialized);
    console.log(`[CACHE] Set: ${key} (expires in ${expirySeconds}s)`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Cache set error for ${key}:`, error.message);
    return false;
  }
};

const getCache = async (key) => {
  if (!isRedisAvailable()) {
    return null;
  }
  
  try {
    const cached = await redisClient.get(key);
    if (cached) {
      console.log(`[CACHE HIT] ${key}`);
      return JSON.parse(cached);
    }
    console.log(`[CACHE MISS] ${key}`);
    return null;
  } catch (error) {
    console.error(`[ERROR] Cache get error for ${key}:`, error.message);
    return null;
  }
};

const deleteCache = async (key) => {
  if (!isRedisAvailable()) {
    return false;
  }
  
  try {
    await redisClient.del(key);
    console.log(`[CACHE] Deleted: ${key}`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Cache delete error for ${key}:`, error.message);
    return false;
  }
};

const deleteCachePattern = async (pattern) => {
  if (!isRedisAvailable()) {
    return false;
  }
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`[CACHE] Deleted: ${keys.length} keys matching ${pattern}`);
    }
    return true;
  } catch (error) {
    console.error(`[ERROR] Cache pattern delete error for ${pattern}:`, error.message);
    return false;
  }
};

const clearAllCache = async () => {
  if (!isRedisAvailable()) {
    return false;
  }
  
  try {
    await redisClient.flushAll();
    console.log('[CACHE] All cache cleared');
    return true;
  } catch (error) {
    console.error('[ERROR] Cache clear error:', error.message);
    return false;
  }
};

const getCacheStats = async () => {
  if (!isRedisAvailable()) {
    return {
      available: false,
      message: 'Redis not available'
    };
  }
  
  try {
    const info = await redisClient.info('stats');
    const keyspace = await redisClient.info('keyspace');
    const memory = await redisClient.info('memory');
    
    return {
      available: true,
      connected: isRedisConnected,
      stats: info,
      keyspace: keyspace,
      memory: memory
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
};

const disconnectRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('[SUCCESS] Redis connection closed gracefully');
    } catch (error) {
      console.error('[ERROR] Error closing Redis connection:', error.message);
    }
  }
};

module.exports = {
  isRedisAvailable,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  clearAllCache,
  getCacheStats
};
