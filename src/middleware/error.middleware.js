const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  // If the headers are already sent, delegate to the default Express handler
  if (res.headersSent) {
    return next(err);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const status = Number(err.status) || 500;

  logger.error(err.message || "Unhandled error", isProduction ? null : err.stack);

  const payload = {
    error: {
      message: isProduction ? "Server Error" : err.message || "Server Error",
      code: err.code || null,
      status,
    },
    method: req.method,
    path: req.originalUrl || req.url,
    timestamp: new Date().toISOString(),
  };

  if (!isProduction && err.stack) payload.error.stack = err.stack;

  res.status(status).json(payload);
};
