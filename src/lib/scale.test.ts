import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FILM_PLANE_ASPECT,
  FOCUS_WIDTH_MAX,
  FOCUS_Z_PX,
  Z_STEP_PX,
  featuredStampWidth,
  focusPlaneWidth,
  neighborPlaneWidth,
  noteSlabWidth,
  planeHeight,
  planeWidth,
  stampWidth,
  stationFrame,
  stationWorldZ,
  wideHeight,
} from "./scale.ts";

test("focused plane is min(78vw, 1280) and never a 2.7 or 3.2 stamp", () => {
  assert.equal(focusPlaneWidth(1440), 1440 * 0.78);
  assert.equal(focusPlaneWidth(2000), FOCUS_WIDTH_MAX);
  assert.equal(wideHeight(1280), 1280 * (9 / 16));
  assert.ok(focusPlaneWidth(1440) > stampWidth());
  assert.ok(focusPlaneWidth(1440) > featuredStampWidth());
  assert.ok(focusPlaneWidth(1280) > stampWidth());
  assert.notEqual(focusPlaneWidth(1440), stampWidth());
  assert.notEqual(focusPlaneWidth(1440), featuredStampWidth());
  assert.notEqual(focusPlaneWidth(1440), 3.2 * 150);
  assert.deepEqual(FILM_PLANE_ASPECT, [16, 9]);
  assert.notDeepEqual(FILM_PLANE_ASPECT, [3.2, 1.8]);
  assert.notDeepEqual(FILM_PLANE_ASPECT, [2.7, 1.52]);
});

test("neighbors peek at 42vw", () => {
  assert.equal(neighborPlaneWidth(1440), 1440 * 0.42);
  assert.ok(neighborPlaneWidth(1440) < focusPlaneWidth(1440));
});

test("note slabs stay portrait and wide enough for 28px type", () => {
  const width = noteSlabWidth(1440);
  assert.ok(width >= 360);
  assert.ok(width <= 480);
  assert.ok(planeHeight(width, true) > width);
});

test("focused wide planes are 16:9; notes ignore the 78vw film lock", () => {
  assert.equal(planeWidth(2000, true, false), 1280);
  assert.equal(planeHeight(1280, false), 720);
  assert.ok(planeWidth(2000, true, true) < 1280);
});

test("dolly keeps neighbors behind the focused plane", () => {
  assert.equal(stationWorldZ(2, 2), FOCUS_Z_PX);
  assert.equal(stationWorldZ(1, 2), FOCUS_Z_PX - Z_STEP_PX);
  assert.equal(stationWorldZ(3, 2), FOCUS_Z_PX - Z_STEP_PX);
  assert.ok(stationWorldZ(0, 2) < FOCUS_Z_PX);
});

test("station frames size from the viewport, not world units", () => {
  const film = stationFrame(
    { kind: "film", index: 0, position: [1.55, 0.28, -4] },
    true,
    1440,
  );
  const neighbor = stationFrame(
    { kind: "film", index: 1, position: [-1.35, 0.42, -7.4] },
    false,
    1440,
    0,
  );
  const note = stationFrame(
    { kind: "note", index: 6, position: [3.15, 0.12, -24.4] },
    false,
    1440,
    0,
  );

  assert.equal(film.width, focusPlaneWidth(1440));
  assert.equal(film.height, wideHeight(film.width));
  assert.equal(film.z, 0);
  assert.equal(neighbor.width, neighborPlaneWidth(1440));
  assert.ok(neighbor.z < film.z);
  assert.ok(note.height > note.width);
  assert.ok(film.width !== stampWidth());
  assert.ok(film.width !== featuredStampWidth());
});
