const assert = require("assert");
const { normalizeMessage, validateMessage } = require("../src/utils/messageValidator");

// Basic sanity checks
(() => {
  assert.strictEqual(normalizeMessage("  hello   world \n"), "hello world");
  assert.strictEqual(validateMessage(""), "Missing message");
  assert.strictEqual(validateMessage("ok", 1), "Message exceeds 1 characters");
  console.log("messageValidator tests: OK");
})();
