const isProduction = process.env.NODE_ENV === "production";

const log = (level, ...args) => {
  const time = new Date().toISOString();
  if (isProduction && level === "debug") return;
  console[level](`[${time}] [${level.toUpperCase()}]`, ...args);
};

module.exports = {
  info: (...args) => log("info", ...args),
  warn: (...args) => log("warn", ...args),
  error: (...args) => log("error", ...args),
  debug: (...args) => log("debug", ...args),
};
