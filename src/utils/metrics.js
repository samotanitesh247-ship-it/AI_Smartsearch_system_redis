/**
 * In-memory metrics tracker.
 * Tracks total searches, cache hits/misses, average latency, etc.
 * Exposed via GET /api/metrics endpoint.
 */

const metrics = {
  totalSearches: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalLatencyMs: 0,
  errors: 0,
  startedAt: new Date().toISOString(),
};

/**
 * Record a completed search request.
 * @param {{ cacheHit: boolean, latencyMs: number }} result
 */
function recordSearch(result) {
  metrics.totalSearches++;
  if (result.cacheHit) {
    metrics.cacheHits++;
  } else {
    metrics.cacheMisses++;
  }
  metrics.totalLatencyMs += result.latencyMs;
}

/** Record an error. */
function recordError() {
  metrics.errors++;
}

/**
 * Get a snapshot of current metrics.
 * @returns {object}
 */
function getMetrics() {
  const avgLatency =
    metrics.totalSearches > 0
      ? Math.round(metrics.totalLatencyMs / metrics.totalSearches)
      : 0;

  const hitRate =
    metrics.totalSearches > 0
      ? ((metrics.cacheHits / metrics.totalSearches) * 100).toFixed(1)
      : '0.0';

  return {
    totalSearches: metrics.totalSearches,
    cacheHits: metrics.cacheHits,
    cacheMisses: metrics.cacheMisses,
    cacheHitRate: `${hitRate}%`,
    averageLatencyMs: avgLatency,
    errors: metrics.errors,
    uptime: process.uptime().toFixed(0) + 's',
    startedAt: metrics.startedAt,
  };
}

/** Reset metrics (useful for tests). */
function resetMetrics() {
  metrics.totalSearches = 0;
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  metrics.totalLatencyMs = 0;
  metrics.errors = 0;
}

module.exports = { recordSearch, recordError, getMetrics, resetMetrics };
