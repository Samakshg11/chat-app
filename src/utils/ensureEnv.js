const required = ["MONGO_URI"];

function ensureEnv(additionalRequired = []) {
  const keys = Array.isArray(additionalRequired) ? required.concat(additionalRequired) : required;
  const missing = keys.filter((k) => {
    // treat MONGO_URI as satisfied if MONGODB_URI is present
    if (k === "MONGO_URI") return !(process.env.MONGO_URI || process.env.MONGODB_URI);
    return !process.env[k];
  });
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

ensureEnv.required = required;

module.exports = ensureEnv;
