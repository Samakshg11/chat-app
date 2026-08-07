const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  logger.error(err);
  const isProduction = process.env.NODE_ENV === "production";

  const payload = {
    error: {
      message: isProduction ? "Server Error" : err.message || "Server Error",
      code: err.code || null,
      status: err.status || 500,
    },
    method: req.method,
    path: req.originalUrl || req.url,
    timestamp: new Date().toISOString(),
  };

  if (!isProduction && err.stack) payload.error.stack = err.stack;

  res.status(payload.error.status).json(payload);
};
