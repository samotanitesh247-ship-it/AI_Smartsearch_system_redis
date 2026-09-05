/**
 * Redis client using ioredis.
 * Exports the client instance and a verifyConnection() health-check.
 */
const Redis = require('ioredis');
const config = require('./env');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    // Exponential backoff: 50ms, 100ms, 200ms… capped at 2s
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Don't throw if Redis is down — let the app degrade gracefully
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('❌  Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('✅  Redis connected');
});

/**
 * Explicitly connect and ping Redis.
 * Called at startup so we know if the cache layer is available.
 */
async function verifyConnection() {
  await redis.connect();
  const pong = await redis.ping();
  if (pong !== 'PONG') {
    throw new Error(`Redis ping returned unexpected: ${pong}`);
  }
  console.log('✅  Redis connection verified');
}

module.exports = { redis, verifyConnection };
