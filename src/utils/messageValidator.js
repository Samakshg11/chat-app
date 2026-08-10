const { MAX_MESSAGE_LENGTH } = require("../config/chat.constants");

const normalizeMessage = (value) => {
  if (value == null) return "";
  const str = typeof value === "string" ? value : String(value);
  return str.replace(/\s+/g, " ").trim();
};

const validateMessage = (value, maxLength = MAX_MESSAGE_LENGTH) => {
  const normalized = normalizeMessage(value);
  if (!normalized) return "Missing message";
  // disallow messages that are only punctuation
  if (/^[\p{P}\s]+$/u.test(normalized)) return "Message contains no readable characters";
  if (normalized.length > maxLength) return `Message exceeds ${maxLength} characters`;
  return null;
};

module.exports = {
  normalizeMessage,
  validateMessage,
};
