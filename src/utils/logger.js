const isProduction = process.env.NODE_ENV === "production";

const safeConsole = (level) => (typeof console[level] === "function" ? console[level] : console.log.bind(console));

const log = (level, prefix, ...args) => {
  const time = new Date().toISOString();
  if (isProduction && level === "debug") return;
  const method = safeConsole(level);
  const pid = process.pid;
  const parts = [`[${time}]`, `[PID:${pid}]`, `[${level.toUpperCase()}]`];
  if (prefix) parts.push(prefix);
  method(parts.join(" "), ...args);
};

const makeChild = (label) => ({
  info: (...args) => log("info", `[${label}]`, ...args),
  warn: (...args) => log("warn", `[${label}]`, ...args),
  error: (...args) => log("error", `[${label}]`, ...args),
  debug: (...args) => log("debug", `[${label}]`, ...args),
});

module.exports = {
  info: (...args) => log("info", null, ...args),
  warn: (...args) => log("warn", null, ...args),
  error: (...args) => log("error", null, ...args),
  debug: (...args) => log("debug", null, ...args),
  child: makeChild,
};
