/**
 * Search controller — handles HTTP request/response.
 * Thin layer: validates input, delegates to service, formats output.
 */
const searchService = require('../services/searchService');
const cacheService = require('../services/cacheService');
const searchRepo = require('../repositories/searchRepository');
const { getMetrics } = require('../utils/metrics');

/**
 * POST /api/search
 * Body: { "query": "what is redis?" }
 */
async function handleSearch(req, res, next) {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing or empty "query" in request body.' },
      });
    }

    if (query.length > 500) {
      return res.status(400).json({
        success: false,
        error: { message: 'Query exceeds maximum length of 500 characters.' },
      });
    }

    const result = await searchService.search(query);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/trending
 * Query param: ?count=10
 */
async function handleTrending(req, res, next) {
  try {
    const count = Math.min(parseInt(req.query.count, 10) || 10, 50);
    const trending = await cacheService.getTrending(count);

    res.json({
      success: true,
      data: { trending, count: trending.length },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/history
 * Query param: ?limit=50
 */
async function handleHistory(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const history = await searchRepo.getRecentSearches(limit);

    res.json({
      success: true,
      data: { history, count: history.length },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/stats
 * Combined metrics: in-memory real-time + MySQL aggregate.
 */
async function handleStats(req, res, next) {
  try {
    const [realtime, dbStats, cacheInfo] = await Promise.all([
      getMetrics(),
      searchRepo.getSearchStats().catch(() => null),
      cacheService.getCacheInfo().catch(() => null),
    ]);

    res.json({
      success: true,
      data: {
        realtime,
        database: dbStats,
        cache: cacheInfo,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/metrics
 * In-memory metrics only (fast).
 */
async function handleMetrics(req, res) {
  res.json({
    success: true,
    data: getMetrics(),
  });
}

/**
 * DELETE /api/cache
 * Flush all cached search responses.
 */
async function handleCacheFlush(req, res, next) {
  try {
    await cacheService.flushAllCache();
    res.json({
      success: true,
      message: 'Cache flushed successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleSearch,
  handleTrending,
  handleHistory,
  handleStats,
  handleMetrics,
  handleCacheFlush,
};
