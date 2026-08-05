const required = ["MONGO_URI"];

function ensureEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

module.exports = ensureEnv;
