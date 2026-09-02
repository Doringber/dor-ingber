import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LINKED_FACES,
  kickerWord,
  linkedStillSrc,
  numberKickersByKind,
  numberedKicker,
  planeKicker,
} from "./kickers.ts";

test("kickers are FILM / GAME / BUILD / NOTE numbered per kind", () => {
  assert.equal(numberedKicker("GAME", 0), "GAME · 01");
  assert.equal(numberedKicker("GAME", 1), "GAME · 02");
  assert.equal(numberedKicker("FILM", 0), "FILM · 01");
  assert.equal(numberedKicker("BUILD", 0), "BUILD · 01");
  assert.equal(numberedKicker("NOTE", 2), "NOTE · 03");
});

test("watermelon is GAME · 01; thinkingbreak is GAME · 02", () => {
  const labeled = numberKickersByKind([
    { kind: "film", slug: "hatul-behasger" },
    { kind: "film", slug: "masoa-harigim" },
    { kind: "film", slug: "savta-maya" },
    { kind: "game", slug: "findmywatermalon" },
    { kind: "game", slug: "thinkingbreak" },
    { kind: "build", slug: "vintage-market" },
    { kind: "note", slug: "yossi-lo-levad" },
    { kind: "note", slug: "lockdown-cat" },
  ]);

  assert.equal(
    labeled.find((station) => station.slug === "findmywatermalon")?.kicker,
    "GAME · 01",
  );
  assert.equal(
    labeled.find((station) => station.slug === "thinkingbreak")?.kicker,
    "GAME · 02",
  );
  assert.equal(
    labeled.find((station) => station.slug === "vintage-market")?.kicker,
    "BUILD · 01",
  );
  assert.equal(
    labeled.find((station) => station.slug === "hatul-behasger")?.kicker,
    "FILM · 01",
  );
  assert.equal(
    labeled.find((station) => station.slug === "masoa-harigim")?.kicker,
    "FILM · 02",
  );
  assert.equal(
    labeled.find((station) => station.slug === "yossi-lo-levad")?.kicker,
    "NOTE · 01",
  );
  assert.equal(
    labeled.find((station) => station.slug === "lockdown-cat")?.kicker,
    "NOTE · 02",
  );
});

test("watermelon still cannot be labeled NOTE · 01", () => {
  assert.equal(kickerWord({ kind: "note", slug: "findmywatermalon" }), "GAME");
  assert.equal(planeKicker({ kind: "note", slug: "findmywatermalon" }), "GAME · 01");
  assert.notEqual(
    planeKicker({ kind: "note", slug: "findmywatermalon" }),
    "NOTE · 01",
  );
  assert.equal(LINKED_FACES.findmywatermalon.kicker, "GAME");
  assert.equal(linkedStillSrc("findmywatermalon"), "/stills/findmywatermalon.jpg");
});

test("kicker words stay FILM GAME BUILD NOTE", () => {
  assert.equal(kickerWord({ kind: "film", slug: "hatul-behasger" }), "FILM");
  assert.equal(kickerWord({ kind: "game", slug: "thinkingbreak" }), "GAME");
  assert.equal(kickerWord({ kind: "build", slug: "vintage-market" }), "BUILD");
  assert.equal(kickerWord({ kind: "note", slug: "anomaly-line" }), "NOTE");
});
