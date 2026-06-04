/**
 * Helper to wrap async route handlers and forward errors to express error handler.
 *
 * Usage: `app.get('/path', asyncHandler(async (req, res) => { ... }))`
 *
 * @param {Function} fn Async route handler (req, res, next)
 * @returns {Function} Express middleware function
 */
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
