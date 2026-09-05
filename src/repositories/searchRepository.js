/**
 * Search history repository — data access layer for MySQL.
 * Raw SQL queries only; no business logic here.
 */
const { pool } = require('../config/db');

/**
 * Insert a search record into search_history.
 * Called asynchronously (fire-and-forget) so it doesn't slow down the response.
 * @param {object} record
 * @param {string} record.queryText   - Original (normalized) query text
 * @param {string} record.queryHash   - SHA-256 hash of normalized query
 * @param {string} record.responseText - AI-generated response
 * @param {string} record.cacheStatus  - 'HIT' or 'MISS'
 * @param {string} record.source       - e.g. 'GEMINI'
 * @param {number} record.latencyMs    - Round-trip time in ms
 */
async function insertSearch(record) {
  const sql = `
    INSERT INTO search_history (query_text, query_hash, response_text, cache_status, source, latency_ms)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  await pool.execute(sql, [
    record.queryText,
    record.queryHash,
    record.responseText,
    record.cacheStatus,
    record.source || 'GEMINI',
    record.latencyMs,
  ]);
}

/**
 * Get recent search history.
 * @param {number} limit - Max rows to return (default 50)
 * @returns {Promise<Array>}
 */
async function getRecentSearches(limit = 50) {
  const sql = `
    SELECT id, query_text, query_hash, cache_status, source, latency_ms, created_at
    FROM search_history
    ORDER BY created_at DESC
    LIMIT ?
  `;
  const [rows] = await pool.execute(sql, [limit]);
  return rows;
}

/**
 * Get search stats (total searches, avg latency, hit rate).
 * @returns {Promise<object>}
 */
async function getSearchStats() {
  const sql = `
    SELECT
      COUNT(*)                                         AS total_searches,
      ROUND(AVG(latency_ms))                           AS avg_latency_ms,
      SUM(cache_status = 'HIT')                        AS cache_hits,
      SUM(cache_status = 'MISS')                       AS cache_misses,
      ROUND(SUM(cache_status = 'HIT') / COUNT(*) * 100, 1) AS hit_rate_pct
    FROM search_history
  `;
  const [rows] = await pool.execute(sql);
  return rows[0];
}

module.exports = { insertSearch, getRecentSearches, getSearchStats };
