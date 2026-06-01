module.exports = (err, req, res, next) => {
  console.error(err);
  const isProduction = process.env.NODE_ENV === "production";
  const message = isProduction ? "Server Error" : err.message || "Server Error";

  res
    .status(err.status || 500)
    .json({ message });
};
