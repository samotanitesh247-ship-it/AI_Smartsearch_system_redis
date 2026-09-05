/**
 * Cache service — Redis cache-aside pattern.
 * Handles GET/SET/DEL for cached search responses,
 * and ZSET-based trending queries tracking.
 */
const { redis } = require('../config/redis');
const config = require('../config/env');

// Key prefixes
const CACHE_PREFIX = 'search:cache:';
const TRENDING_KEY = 'search:trending';

/**
 * Get a cached response by query hash.
 * @param {string} queryHash
 * @returns {Promise<string|null>} Cached response text or null
 */
async function getCachedResponse(queryHash) {
  try {
    const cached = await redis.get(`${CACHE_PREFIX}${queryHash}`);
    return cached; // null if miss
  } catch (err) {
    console.error('⚠️  Redis GET error (degrading gracefully):', err.message);
    return null;
  }
}

/**
 * Cache a response with TTL.
 * @param {string} queryHash
 * @param {string} responseText
 */
async function setCachedResponse(queryHash, responseText) {
  try {
    await redis.set(
      `${CACHE_PREFIX}${queryHash}`,
      responseText,
      'EX',
      config.cache.ttlSeconds
    );
  } catch (err) {
    console.error('⚠️  Redis SET error:', err.message);
  }
}

/**
 * Invalidate a specific cache entry.
 * @param {string} queryHash
 */
async function invalidateCache(queryHash) {
  try {
    await redis.del(`${CACHE_PREFIX}${queryHash}`);
  } catch (err) {
    console.error('⚠️  Redis DEL error:', err.message);
  }
}

/**
 * Flush all search cache entries.
 * Uses SCAN to avoid blocking Redis with KEYS *.
 */
async function flushAllCache() {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        `${CACHE_PREFIX}*`,
        'COUNT',
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch (err) {
    console.error('⚠️  Redis flush error:', err.message);
  }
}

// ──────────────────────────────────────────────────
// Trending queries (ZSET with timestamp-based scores)
// ──────────────────────────────────────────────────

/**
 * Increment the trending score for a query.
 * Uses ZINCRBY so frequently searched queries bubble up.
 * Also prunes entries older than the trending window.
 * @param {string} normalizedQuery
 */
async function recordTrending(normalizedQuery) {
  try {
    // Increment score by 1
    await redis.zincrby(TRENDING_KEY, 1, normalizedQuery);
  } catch (err) {
    console.error('⚠️  Redis trending error:', err.message);
  }
}

/**
 * Get the top-N trending queries.
 * @param {number} count - How many to return (default 10)
 * @returns {Promise<Array<{ query: string, score: number }>>}
 */
async function getTrending(count = 10) {
  try {
    // ZREVRANGE returns highest-scored members first
    const results = await redis.zrevrange(TRENDING_KEY, 0, count - 1, 'WITHSCORES');

    // ioredis returns flat array: [member, score, member, score, ...]
    const trending = [];
    for (let i = 0; i < results.length; i += 2) {
      trending.push({
        query: results[i],
        score: parseInt(results[i + 1], 10),
      });
    }
    return trending;
  } catch (err) {
    console.error('⚠️  Redis trending GET error:', err.message);
    return [];
  }
}

/**
 * Get info about the Redis cache (key count, memory, etc.)
 * @returns {Promise<object>}
 */
async function getCacheInfo() {
  try {
    const info = await redis.info('memory');
    const dbSize = await redis.dbsize();

    // Parse used_memory_human from INFO output
    const memMatch = info.match(/used_memory_human:(\S+)/);
    const usedMemory = memMatch ? memMatch[1] : 'unknown';

    return {
      totalKeys: dbSize,
      usedMemory,
      ttlSeconds: config.cache.ttlSeconds,
    };
  } catch (err) {
    console.error('⚠️  Redis info error:', err.message);
    return { totalKeys: 0, usedMemory: 'unknown', ttlSeconds: config.cache.ttlSeconds };
  }
}

module.exports = {
  getCachedResponse,
  setCachedResponse,
  invalidateCache,
  flushAllCache,
  recordTrending,
  getTrending,
  getCacheInfo,
};
