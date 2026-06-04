module.exports = (err, req, res, next) => {
  console.error(err);
  const isProduction = process.env.NODE_ENV === "production";

  const payload = {
    message: isProduction ? "Server Error" : err.message || "Server Error",
    code: err.code || undefined,
    timestamp: new Date().toISOString(),
  };

  if (!isProduction && err.stack) payload.stack = err.stack;

  res.status(err.status || 500).json(payload);
};
