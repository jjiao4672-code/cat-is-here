const test = require("node:test");
const assert = require("node:assert/strict");
const { canMove, shouldRelockFront } = require("./roomViews.js");

test("room views keep the front wall locked until the assessment is complete", () => {
  assert.equal(canMove("desk", "right", false), true);
  assert.equal(canMove("desk", "front", false), false);
  assert.equal(canMove("right", "front", false), false);
  assert.equal(canMove("desk", "front", true), true);
  assert.equal(canMove("right", "front", true), true);
  assert.equal(canMove("front", "right", true), true);
  assert.equal(canMove("front", "desk", true), true);
});

test("starting over locks the front wall again", () => {
  assert.equal(shouldRelockFront(true, true, true), true);
  assert.equal(shouldRelockFront(true, false, true), false);
  assert.equal(shouldRelockFront(false, true, true), false);
});
