import assert from "node:assert/strict";
import { test } from "node:test";
import {
  focusedFromDolly,
  incomingDrag,
  indexAfterSwipe,
  jumpDolly,
  shouldCloseDown,
  shouldCommitSwipe,
  snapDolly,
  stepSpring,
} from "./swipe.ts";

test("horizontal |dx|>40 commits, vertical-dominant does not", () => {
  assert.equal(shouldCommitSwipe(41, 10), true);
  assert.equal(shouldCommitSwipe(-41, 12), true);
  assert.equal(shouldCommitSwipe(40, 0), false);
  assert.equal(shouldCommitSwipe(80, 90), false);
});

test("swipe down closes when vertical travel wins", () => {
  assert.equal(shouldCloseDown(8, 41), true);
  assert.equal(shouldCloseDown(0, 40), false);
  assert.equal(shouldCloseDown(90, 80), false);
  assert.equal(shouldCloseDown(10, -41), false);
});

test("one-plane goTo jumps dolly so snapDolly cannot revert", () => {
  const last = 7;
  let index = 0;
  let dolly = 0;
  let target = 0;

  for (let swipe = 0; swipe < 10; swipe += 1) {
    const next = indexAfterSwipe(index, -50, last);
    const jumped = jumpDolly(next);
    index = next;
    dolly = jumped.dolly;
    target = jumped.target;
    assert.equal(dolly, index);
    assert.equal(target, index);
    assert.equal(focusedFromDolly(dolly, last + 1, true, index), index);
    assert.equal(snapDolly(dolly, last + 1), index);
  }

  assert.equal(index, 7);
});

test("without a dolly jump, snapDolly fights the new index", () => {
  assert.equal(snapDolly(0.08, 8), 0);
  assert.equal(focusedFromDolly(0.08, 8, true, 1), 1);
  assert.equal(focusedFromDolly(0.08, 8, false, 1), 0);
});

test("incoming drag starts from the opposite edge", () => {
  assert.equal(incomingDrag(-80), 88);
  assert.equal(incomingDrag(80), -88);
});

test("spring moves toward the target without staying put", () => {
  let pos = 80;
  let vel = 0;
  for (let i = 0; i < 12; i += 1) {
    const next = stepSpring(pos, vel, 0, 1 / 60);
    pos = next.pos;
    vel = next.vel;
  }
  assert.ok(pos < 80);
  assert.ok(Math.abs(pos) < 80);
});
