/**
 * Search routes — maps HTTP verbs/paths to controller functions.
 * All routes are prefixed with /api by the parent router in server.js.
 */
const { Router } = require('express');
const {
  handleSearch,
  handleTrending,
  handleHistory,
  handleStats,
  handleMetrics,
  handleCacheFlush,
} = require('../controllers/searchController');

const router = Router();

// Core search endpoint
router.post('/search', handleSearch);

// Trending queries (ZSET-based)
router.get('/trending', handleTrending);

// Search history from MySQL
router.get('/history', handleHistory);

// Combined stats (realtime + DB + cache)
router.get('/stats', handleStats);

// In-memory metrics (fast)
router.get('/metrics', handleMetrics);

// Cache management
router.delete('/cache', handleCacheFlush);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
