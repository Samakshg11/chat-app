const { getPagination } = require("../src/utils/requestParsers");
const assert = require("assert");

describe("requestParsers#getPagination", () => {
  it("returns defaults for invalid inputs", () => {
    const { safePage, safeLimit } = getPagination("abc", "def");
    assert.strictEqual(safePage >= 1, true);
    assert.strictEqual(safeLimit >= 1, true);
  });
});
