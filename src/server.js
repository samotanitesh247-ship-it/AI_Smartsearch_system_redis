/**
 * Server entrypoint — bootstraps Express with all middleware,
 * connects to MySQL + Redis, initializes Gemini, and starts listening.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const { verifyConnection: verifyDB } = require('./config/db');
const { verifyConnection: verifyRedis } = require('./config/redis');
const gemini = require('./config/gemini');
const searchRoutes = require('./routes/searchRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

const app = express();

// ──────────────────────────────────────────────────
// Global middleware
// ──────────────────────────────────────────────────
app.use(helmet());                     // Security headers
app.use(cors());                       // CORS for all origins (tighten in prod)
app.use(morgan('dev'));                // Request logging
app.use(express.json({ limit: '1mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Rate limiting — 30 requests/min per IP
app.use('/api', rateLimiter({ windowMs: 60000, maxRequests: 30 }));

// ──────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────
app.use('/api', searchRoutes);

// Root endpoint — basic server info
app.get('/', (req, res) => {
  res.json({
    name: 'AI SmartSearch System',
    version: '1.0.0',
    description: 'Cache-aside search with Redis + Gemini AI + MySQL persistence',
    endpoints: {
      search: 'POST /api/search',
      trending: 'GET  /api/trending',
      history: 'GET  /api/history',
      stats: 'GET  /api/stats',
      metrics: 'GET  /api/metrics',
      cache: 'DELETE /api/cache',
      health: 'GET  /api/health',
    },
  });
});

// ──────────────────────────────────────────────────
// Error handling (must be registered AFTER routes)
// ──────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ──────────────────────────────────────────────────
// Startup sequence
// ──────────────────────────────────────────────────
async function start() {
  console.log('\n🚀  Starting AI SmartSearch System...\n');

  // 1. Verify MySQL connectivity
  try {
    await verifyDB();
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    console.error('   Make sure MySQL is running and .env credentials are correct.');
    process.exit(1);
  }

  // 2. Connect to Redis
  try {
    await verifyRedis();
  } catch (err) {
    console.error('⚠️  Redis connection failed:', err.message);
    console.error('   The app will run but caching will be disabled (degraded mode).');
    // Don't exit — Redis is optional, the app degrades gracefully
  }

  // 3. Initialize Gemini AI client
  gemini.initialize();

  // 4. Start listening
  app.listen(config.port, () => {
    console.log(`\n🟢  Server running on http://localhost:${config.port}`);
    console.log(`📡  Environment: ${config.nodeEnv}`);
    console.log(`📊  Metrics:     http://localhost:${config.port}/api/metrics`);
    console.log(`🔍  Search:      POST http://localhost:${config.port}/api/search`);
    console.log(`🔥  Trending:    http://localhost:${config.port}/api/trending`);
    console.log('');
  });
}

start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋  Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋  Received SIGTERM, shutting down...');
  process.exit(0);
});

module.exports = app; // Export for testing
