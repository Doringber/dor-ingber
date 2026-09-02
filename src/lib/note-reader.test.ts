import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldCloseDown, shouldCommitSwipe } from "./swipe.ts";
import {
  adjacentNoteSlugs,
  noteFromPath,
  slugAfterNoteSwipe,
  writingPath,
} from "./note-reader.ts";

test("swipe down closes, horizontal or short flicks do not", () => {
  assert.equal(shouldCloseDown(8, 41), true);
  assert.equal(shouldCloseDown(-12, 80), true);
  assert.equal(shouldCloseDown(0, 40), false);
  assert.equal(shouldCloseDown(80, 90), true);
  assert.equal(shouldCloseDown(90, 80), false);
  assert.equal(shouldCloseDown(10, -41), false);
});

test("note path helpers stay on /writing/[slug]", () => {
  assert.equal(writingPath("lockdown-cat"), "/writing/lockdown-cat");
  assert.equal(noteFromPath("/writing/lockdown-cat"), "lockdown-cat");
  assert.equal(noteFromPath("/writing/lockdown-cat/extra"), null);
  assert.equal(noteFromPath("/"), null);
});

test("adjacent slugs walk the two notes and stop at the ends", () => {
  const slugs = ["lockdown-cat", "anomaly-line"] as const;
  assert.deepEqual(adjacentNoteSlugs(slugs, "lockdown-cat"), {
    prev: null,
    next: "anomaly-line",
  });
  assert.deepEqual(adjacentNoteSlugs(slugs, "anomaly-line"), {
    prev: "lockdown-cat",
    next: null,
  });
  assert.deepEqual(adjacentNoteSlugs(slugs, "missing"), {
    prev: null,
    next: null,
  });
});

test("horizontal swipe moves between notes and snaps at the ends", () => {
  const slugs = ["lockdown-cat", "anomaly-line"] as const;
  assert.equal(shouldCommitSwipe(-41, 10), true);
  assert.equal(slugAfterNoteSwipe("lockdown-cat", slugs, -50), "anomaly-line");
  assert.equal(slugAfterNoteSwipe("lockdown-cat", slugs, 50), null);
  assert.equal(slugAfterNoteSwipe("anomaly-line", slugs, 50), "lockdown-cat");
  assert.equal(slugAfterNoteSwipe("anomaly-line", slugs, -50), null);
});
