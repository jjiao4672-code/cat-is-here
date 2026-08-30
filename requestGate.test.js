const test = require("node:test");
const assert = require("node:assert/strict");
const { createRequestGate } = require("./requestGate.js");

test("request gate limits a client and opens again after the window", () => {
  let time = 0;
  const take = createRequestGate({ windowMs: 1_000, limit: 2, now: () => time });
  assert.equal(take("judge").allowed, true);
  assert.equal(take("judge").allowed, true);
  assert.equal(take("judge").allowed, false);
  time = 1_000;
  assert.equal(take("judge").allowed, true);
});

test("request gate rejects new keys instead of growing without bound", () => {
  const take = createRequestGate({ maxKeys: 1, now: () => 0 });
  assert.equal(take("first").allowed, true);
  assert.equal(take("second").allowed, false);
});
