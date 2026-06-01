const { decodeAuthToken, extractBearerToken } = require("../utils/auth");
const { isValidObjectId, toObjectIdString } = require("../utils/requestParsers");

module.exports = (req, res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  const payload = decodeAuthToken(token);
  const payloadUserId = payload?.userId || payload?.id || payload?._id;

  const normalizedUserId = payloadUserId ? toObjectIdString(payloadUserId) : null;
  const isAuthenticated = Boolean(normalizedUserId && isValidObjectId(normalizedUserId));
  req.auth = {
    userId: isAuthenticated ? normalizedUserId : null,
    isAuthenticated,
  };

  next();
};
