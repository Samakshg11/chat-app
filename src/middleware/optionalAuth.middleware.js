const { decodeAuthToken, extractBearerToken } = require("../utils/auth");
const { toObjectIdString } = require("../utils/requestParsers");

module.exports = (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  const payload = decodeAuthToken(token);
  const payloadUserId = payload?.userId || payload?.id || payload?._id;

  req.auth = {
    userId: payloadUserId ? toObjectIdString(payloadUserId) : null,
    isAuthenticated: Boolean(payloadUserId),
  };

  next();
};
