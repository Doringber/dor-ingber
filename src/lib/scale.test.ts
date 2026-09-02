import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FILM_PLANE_ASPECT,
  FOCUS_OPACITY,
  FOCUS_WIDTH_MAX,
  FOCUS_WIDTH_VW,
  FOCUS_Z_PX,
  NEIGHBOR_OPACITY,
  NEIGHBOR_WIDTH_VW,
  Z_STEP_PX,
  featuredStampWidth,
  focusAmount,
  focusOpacity,
  focusPlaneWidth,
  neighborPlaneWidth,
  noteSlabWidth,
  planeHeight,
  planeWidth,
  planeWidthAtFocus,
  stampWidth,
  stationFrame,
  stationSize,
  stationWorldZ,
  wideHeight,
} from "./scale.ts";

test("focused plane is min(56vw, 960) and never a 2.7 or 3.2 stamp", () => {
  assert.equal(FOCUS_WIDTH_VW, 0.56);
  assert.equal(FOCUS_WIDTH_MAX, 960);
  assert.notEqual(FOCUS_WIDTH_VW, 0.78);
  assert.notEqual(FOCUS_WIDTH_MAX, 1280);
  assert.equal(focusPlaneWidth(1440), 1440 * 0.56);
  assert.equal(focusPlaneWidth(2000), FOCUS_WIDTH_MAX);
  assert.equal(wideHeight(960), 960 * (9 / 16));
  assert.ok(focusPlaneWidth(1440) > stampWidth());
  assert.ok(focusPlaneWidth(1440) > featuredStampWidth());
  assert.ok(focusPlaneWidth(1280) > stampWidth());
  assert.ok(focusPlaneWidth(2000) < 1280);
  assert.notEqual(focusPlaneWidth(1440), stampWidth());
  assert.notEqual(focusPlaneWidth(1440), featuredStampWidth());
  assert.notEqual(focusPlaneWidth(1440), 3.2 * 150);
  assert.deepEqual(FILM_PLANE_ASPECT, [16, 9]);
  assert.notDeepEqual(FILM_PLANE_ASPECT, [3.2, 1.8]);
  assert.notDeepEqual(FILM_PLANE_ASPECT, [2.7, 1.52]);
});

test("neighbors stay at 28vw, not the hero lock", () => {
  assert.equal(NEIGHBOR_WIDTH_VW, 0.28);
  assert.equal(neighborPlaneWidth(1440), 1440 * 0.28);
  assert.ok(neighborPlaneWidth(1440) < focusPlaneWidth(1440));
  assert.notEqual(neighborPlaneWidth(1440), focusPlaneWidth(1440));
});

test("note slabs stay portrait and wide enough for 28px type", () => {
  const width = noteSlabWidth(1440);
  assert.ok(width >= 360);
  assert.ok(width <= 480);
  assert.ok(planeHeight(width, true) > width);
});

test("focused wide planes are 16:9; notes ignore the 56vw film lock", () => {
  assert.equal(planeWidth(2000, true, false), 960);
  assert.equal(planeHeight(960, false), 540);
  assert.ok(planeWidth(2000, true, true) < 960);
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
  assert.notEqual(film.width, neighbor.width);
});

test("scale interpolates with focus: incoming grows, leaving shrinks", () => {
  const viewport = 1440;
  const hero = focusPlaneWidth(viewport);
  const neighbor = neighborPlaneWidth(viewport);
  const leavingEarly = planeWidthAtFocus(
    viewport,
    focusAmount(0, 0.25),
    false,
  );
  const incomingEarly = planeWidthAtFocus(
    viewport,
    focusAmount(1, 0.25),
    false,
  );
  const leavingLate = planeWidthAtFocus(
    viewport,
    focusAmount(0, 0.75),
    false,
  );
  const incomingLate = planeWidthAtFocus(
    viewport,
    focusAmount(1, 0.75),
    false,
  );

  assert.equal(focusAmount(0, 0), 1);
  assert.equal(focusAmount(1, 0), 0);
  assert.equal(focusAmount(0, 0.25), 0.75);
  assert.equal(focusAmount(1, 0.25), 0.25);
  assert.ok(leavingEarly > incomingEarly);
  assert.ok(leavingEarly < hero);
  assert.ok(incomingEarly > neighbor);
  assert.ok(incomingLate > leavingLate);
  assert.equal(incomingLate, planeWidthAtFocus(viewport, 0.75, false));
  assert.equal(
    planeWidthAtFocus(viewport, 0.5, false),
    neighbor + (hero - neighbor) * 0.5,
  );
});

test("resting stations do not all share the hero width", () => {
  const viewport = 1440;
  const focused = stationSize(viewport, 0, 0, false);
  const neighbor = stationSize(viewport, 1, 0, false);
  const far = stationSize(viewport, 3, 0, false);

  assert.equal(focused.width, focusPlaneWidth(viewport));
  assert.equal(neighbor.width, neighborPlaneWidth(viewport));
  assert.equal(far.width, neighborPlaneWidth(viewport));
  assert.notEqual(focused.width, neighbor.width);
  assert.ok(focused.width <= FOCUS_WIDTH_MAX);
});

test("neighbors stay quieter than the focused plane", () => {
  assert.equal(focusOpacity(1), FOCUS_OPACITY);
  assert.equal(focusOpacity(0), NEIGHBOR_OPACITY);
  assert.ok(focusOpacity(0) < focusOpacity(0.5));
  assert.ok(focusOpacity(0.5) < focusOpacity(1));
});
