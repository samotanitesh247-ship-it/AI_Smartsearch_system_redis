/**
 * Query normalization + hashing utilities.
 * Ensures "Best Pizza", " best  pizza ", and "BEST PIZZA" all map to the same cache key.
 */
const crypto = require('crypto');

/**
 * Normalize a query string:
 * 1. Trim whitespace
 * 2. Collapse multiple spaces into one
 * 3. Lowercase
 * @param {string} query
 * @returns {string}
 */
function normalizeQuery(query) {
  return query.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * SHA-256 hash of a normalized query.
 * Used as the Redis cache key and the query_hash in MySQL.
 * @param {string} normalizedQuery
 * @returns {string} 64-char hex hash
 */
function hashQuery(normalizedQuery) {
  return crypto.createHash('sha256').update(normalizedQuery).digest('hex');
}

/**
 * Convenience: normalize then hash.
 * @param {string} rawQuery
 * @returns {{ normalized: string, hash: string }}
 */
function processQuery(rawQuery) {
  const normalized = normalizeQuery(rawQuery);
  const hash = hashQuery(normalized);
  return { normalized, hash };
}

module.exports = { normalizeQuery, hashQuery, processQuery };
