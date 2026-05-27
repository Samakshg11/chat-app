const jwt = require("jsonwebtoken");

const extractBearerToken = (authorizationHeader) => {
  if (typeof authorizationHeader !== "string") {
    return null;
  }

  const [scheme, token] = authorizationHeader.trim().split(/\s+/);
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }
  return token;
};

const decodeAuthToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || !token) {
    return null;
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  decodeAuthToken,
  extractBearerToken,
};
