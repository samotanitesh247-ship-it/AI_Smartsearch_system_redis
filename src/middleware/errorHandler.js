/**
 * Global error-handling middleware.
 * Express identifies error handlers by their 4-argument signature (err, req, res, next).
 */
function errorHandler(err, req, res, _next) {
  console.error('💥  Unhandled error:', err);

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}

/**
 * 404 handler — placed after all routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}

module.exports = { errorHandler, notFoundHandler };
