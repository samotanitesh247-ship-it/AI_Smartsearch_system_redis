/**
 * Search service — the core orchestrator.
 * Implements the cache-aside pattern:
 *   1. Normalize + hash query
 *   2. Check Redis cache
 *   3. On miss → call Gemini AI → cache the response
 *   4. Record trending in ZSET
 *   5. Async persist to MySQL (fire-and-forget)
 *   6. Track metrics
 */
const { processQuery } = require('../utils/queryHelper');
const { recordSearch, recordError } = require('../utils/metrics');
const cacheService = require('./cacheService');
const gemini = require('../config/gemini');
const searchRepo = require('../repositories/searchRepository');

/**
 * Execute a smart search.
 * @param {string} rawQuery - The raw query string from the user.
 * @returns {Promise<object>} Search result with metadata.
 */
async function search(rawQuery) {
  const startTime = Date.now();
  const { normalized, hash } = processQuery(rawQuery);

  let responseText;
  let cacheStatus;

  try {
    // Step 1: Check Redis cache
    const cached = await cacheService.getCachedResponse(hash);

    if (cached) {
      // ── CACHE HIT ──
      responseText = cached;
      cacheStatus = 'HIT';
    } else {
      // ── CACHE MISS → call Gemini ──
      responseText = await gemini.generateResponse(normalized);
      cacheStatus = 'MISS';

      // Cache the fresh response (non-blocking — don't await if you prefer speed,
      // but awaiting here ensures cache is set before the function returns)
      await cacheService.setCachedResponse(hash, responseText);
    }

    const latencyMs = Date.now() - startTime;

    // Step 2: Record in trending ZSET (fire-and-forget)
    cacheService.recordTrending(normalized).catch((err) =>
      console.error('Trending record error:', err.message)
    );

    // Step 3: Async persist to MySQL (fire-and-forget)
    searchRepo
      .insertSearch({
        queryText: normalized,
        queryHash: hash,
        responseText,
        cacheStatus,
        source: 'GEMINI',
        latencyMs,
      })
      .catch((err) =>
        console.error('MySQL insert error (non-fatal):', err.message)
      );

    // Step 4: Update in-memory metrics
    recordSearch({ cacheHit: cacheStatus === 'HIT', latencyMs });

    return {
      query: normalized,
      queryHash: hash,
      response: responseText,
      cacheStatus,
      source: 'GEMINI',
      latencyMs,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    recordError();
    throw err;
  }
}

module.exports = { search };
