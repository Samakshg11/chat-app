const { MAX_MESSAGE_LENGTH } = require("../config/chat.constants");

const normalizeMessage = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

const validateMessage = (value, maxLength = MAX_MESSAGE_LENGTH) => {
  const normalized = normalizeMessage(value);
  if (!normalized) return "Missing message";
  if (normalized.length > maxLength) return `Message exceeds ${maxLength} characters`;
  return null;
};

module.exports = {
  normalizeMessage,
  validateMessage,
};
