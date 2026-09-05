/**
 * Rate limiter middleware — simple in-memory sliding window.
 * No external dependency needed. For production, swap with redis-based limiter.
 */

const requestCounts = new Map();

// Clean up old entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts) {
    if (now - data.windowStart > 60000) {
      requestCounts.delete(key);
    }
  }
}, 60000);

/**
 * Create a rate-limiter middleware.
 * @param {{ windowMs: number, maxRequests: number }} options
 */
function rateLimiter({ windowMs = 60000, maxRequests = 30 } = {}) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, windowStart: now });
      return next();
    }

    const data = requestCounts.get(key);

    // Reset window if expired
    if (now - data.windowStart > windowMs) {
      data.count = 1;
      data.windowStart = now;
      return next();
    }

    data.count++;

    if (data.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: { message: 'Too many requests. Please try again later.' },
      });
    }

    next();
  };
}

module.exports = { rateLimiter };
