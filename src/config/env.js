/**
 * Centralized environment configuration.
 * Reads process.env once, applies defaults, and exports a clean config object.
 * The rest of the app should import this — never touch process.env directly.
 */
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smartsearch',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },

  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS, 10) || 3600,
    trendingWindowHours: parseInt(process.env.TRENDING_WINDOW_HOURS, 10) || 24,
  },
};