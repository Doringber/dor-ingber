import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LINKED_FACES,
  kickerForKind,
  linkedStillSrc,
  planeKicker,
} from "./kickers.ts";

test("kickers are only FILM GAME BUILD NOTE — never NOTE · 01", () => {
  for (const kind of ["film", "game", "build", "note"] as const) {
    const kicker = kickerForKind(kind);
    assert.match(kicker, /^(FILM|GAME|BUILD|NOTE)$/);
    assert.ok(!kicker.includes("·"));
    assert.ok(!/\d/.test(kicker));
  }
});

test("findmywatermalon and thinkingbreak are GAME, vintage-market is BUILD", () => {
  assert.equal(
    planeKicker({ kind: "game", slug: "findmywatermalon" }),
    "GAME",
  );
  assert.equal(planeKicker({ kind: "game", slug: "thinkingbreak" }), "GAME");
  assert.equal(planeKicker({ kind: "build", slug: "vintage-market" }), "BUILD");
  assert.equal(LINKED_FACES.findmywatermalon.kicker, "GAME");
  assert.equal(LINKED_FACES.thinkingbreak.kicker, "GAME");
  assert.equal(LINKED_FACES["vintage-market"].kicker, "BUILD");
});

test("watermelon still cannot be labeled NOTE", () => {
  const melon = planeKicker({ kind: "note", slug: "findmywatermalon" });
  assert.equal(melon, "GAME");
  assert.notEqual(melon, "NOTE");
  assert.notEqual(melon, "NOTE · 01");
  assert.equal(linkedStillSrc("findmywatermalon"), "/stills/findmywatermalon.jpg");
});

test("films stay FILM and writing stays NOTE", () => {
  assert.equal(planeKicker({ kind: "film", slug: "hatul-behasger" }), "FILM");
  assert.equal(planeKicker({ kind: "film", slug: "savta-maya" }), "FILM");
  assert.equal(planeKicker({ kind: "film", slug: "masoa-harigim" }), "FILM");
  assert.equal(planeKicker({ kind: "note", slug: "lockdown-cat" }), "NOTE");
  assert.equal(planeKicker({ kind: "note", slug: "yossi-lo-levad" }), "NOTE");
  assert.equal(planeKicker({ kind: "note", slug: "anomaly-line" }), "NOTE");
});
