/**
 * Chat-related defaults and limits.
 * - DEFAULT_LIMIT: default messages per page
 * - DEFAULT_PAGE: default pagination start
 * - MAX_LIMIT: maximum allowed page size for safety
 * - MAX_MESSAGE_LENGTH: maximum characters allowed in a message
 */
module.exports = {
  DEFAULT_LIMIT: 20,
  DEFAULT_PAGE: 1,
  MAX_LIMIT: 100,
  MAX_MESSAGE_LENGTH: 4000,
};
