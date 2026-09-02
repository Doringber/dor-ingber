import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { existsSync } from "node:fs";
import { LINKED_FACES, numberKickersByKind } from "./kickers.ts";
import {
  FOCUS_LIGHT,
  NEIGHBOR_LIGHT,
  NOTE_INK,
  NOTE_READER,
  NOTE_SLAB,
  VOLUME_BG,
} from "./scale.ts";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const shader = readFileSync(new URL("./gpu/volume.wgsl", import.meta.url), "utf8");

test("volume CSS and shader stay warm dark, not pure black", () => {
  assert.match(css, /#1c1612/i);
  assert.match(css, /background:\s*#1c1612/i);
  assert.doesNotMatch(css, /\.spatial-root[\s\S]{0,200}background:\s*#050507/);
  assert.match(shader, /0\.110,\s*0\.086,\s*0\.071/);
  assert.doesNotMatch(shader, /0\.0196,\s*0\.0196,\s*0\.0275/);
  assert.equal(VOLUME_BG.toLowerCase(), "#1c1612");
});

test("note slabs and reader are kraft, never black", () => {
  assert.match(css, /#c4a06a/i);
  assert.match(css, /#d4b48a/i);
  assert.match(css, /#2c2118/i);
  assert.match(css, /\.film-window\.is-note[\s\S]*?background:\s*#d4b48a/);
  assert.match(css, /\.fallback-note\.film-rebate[\s\S]*?background-color:\s*#c4a06a/);
  assert.match(css, /\.note-reader-sheet[\s\S]*?background:\s*#d4b48a/);
  assert.match(css, /\.note-reader-sheet[\s\S]*?color:\s*#2c2118/);
  assert.doesNotMatch(css, /\.film-window\.is-note[\s\S]{0,80}background:\s*#0a0a0c/);
  assert.equal(NOTE_SLAB.toLowerCase(), "#c4a06a");
  assert.equal(NOTE_READER.toLowerCase(), "#d4b48a");
  assert.equal(NOTE_INK.toLowerCase(), "#2c2118");
});

test("films are lifted B&W; GAME/BUILD keep a little tone", () => {
  assert.match(css, /\.media-image[\s\S]*?grayscale\(1\)[\s\S]*?brightness\(1\.14\)/);
  assert.match(css, /\.media-image\.is-tone[\s\S]*?grayscale\(0\.38\)/);
  assert.doesNotMatch(css, /\.media-image\.is-tone[\s\S]*?grayscale\(1\)/);
});

test("neighbor light sits at 0.55 and lerps with focus", () => {
  assert.equal(NEIGHBOR_LIGHT, 0.55);
  assert.equal(FOCUS_LIGHT, 1);
  assert.match(css, /opacity:\s*0\.55/);
  assert.match(css, /--station-light:\s*0\.55/);
});

test("yossi note and watermelon GAME · 01 stay in the lock", () => {
  assert.equal(existsSync(new URL("../../content/writing/yossi-lo-levad.mdx", import.meta.url)), true);
  assert.equal(LINKED_FACES.findmywatermalon.kicker, "GAME");
  const labeled = numberKickersByKind([
    { kind: "game", slug: "findmywatermalon" },
    { kind: "note", slug: "yossi-lo-levad" },
  ]);
  assert.equal(labeled[0]?.kicker, "GAME · 01");
  assert.equal(labeled[1]?.kicker, "NOTE · 01");
});
