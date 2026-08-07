const { getPagination } = require("../src/utils/requestParsers");
const assert = require("assert");
const { parseBoolean } = require("../src/utils/requestParsers");

describe("requestParsers#getPagination", () => {
  it("returns defaults for invalid inputs", () => {
    const { safePage, safeLimit } = getPagination("abc", "def");
    assert.strictEqual(safePage >= 1, true);
    assert.strictEqual(safeLimit >= 1, true);
  });

  it("parseBoolean handles common values", () => {
    assert.strictEqual(parseBoolean("true"), true);
    assert.strictEqual(parseBoolean("0"), false);
    assert.strictEqual(parseBoolean(1), true);
    assert.strictEqual(parseBoolean(0), false);
    assert.strictEqual(parseBoolean(null), false);
  });
});
