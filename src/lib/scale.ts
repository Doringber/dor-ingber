import type { SpatialStation } from "@/lib/stations";

export const FILM_PLANE_ASPECT: [number, number] = [16, 9];
export const NOTE_SLAB_ASPECT: [number, number] = [12, 20];
export const FOCUS_WIDTH_VW = 0.78;
export const FOCUS_WIDTH_MAX = 1280;
export const NEIGHBOR_WIDTH_VW = 0.42;
export const WIDE_ASPECT = 9 / 16;
export const SLAB_ASPECT = 2.05 / 1.2;
export const NOTE_SLAB_VW = 0.36;
export const NOTE_SLAB_MAX = 480;
export const STAMP_WORLD = 2.7;
export const STAMP_FEATURED = 3.2;
export const STAMP_UNIT = 150;
export const FOCUS_Z_PX = 0;
export const Z_STEP_PX = 280;
export const VOLUME_LIFT_PX = 36;
export const XY_POSE_UNIT = 2;

export type StationFrame = {
  width: number;
  height: number;
  x: number;
  y: number;
  z: number;
};

export function focusPlaneWidth(viewportWidth: number): number {
  return Math.min(viewportWidth * FOCUS_WIDTH_VW, FOCUS_WIDTH_MAX);
}

export function neighborPlaneWidth(viewportWidth: number): number {
  return viewportWidth * NEIGHBOR_WIDTH_VW;
}

export function wideHeight(width: number): number {
  return width * WIDE_ASPECT;
}

export function noteSlabWidth(viewportWidth: number): number {
  return Math.min(viewportWidth * NOTE_SLAB_VW, NOTE_SLAB_MAX);
}

export function noteSlabHeight(width: number): number {
  return width * SLAB_ASPECT;
}

export function stampWidth(): number {
  return STAMP_WORLD * STAMP_UNIT;
}

export function featuredStampWidth(): number {
  return STAMP_FEATURED * STAMP_UNIT;
}

export function planeWidth(
  viewportWidth: number,
  focused: boolean,
  slab: boolean,
): number {
  if (slab) {
    return noteSlabWidth(viewportWidth);
  }
  return focused ? focusPlaneWidth(viewportWidth) : neighborPlaneWidth(viewportWidth);
}

export function planeHeight(width: number, slab: boolean): number {
  return slab ? noteSlabHeight(width) : wideHeight(width);
}

export function stationWorldZ(index: number, dolly: number): number {
  return FOCUS_Z_PX - Math.abs(index - dolly) * Z_STEP_PX;
}

export function xyUnit(viewportWidth: number): number {
  return neighborPlaneWidth(viewportWidth) / XY_POSE_UNIT;
}

export function stationFrame(
  station: Pick<SpatialStation, "kind" | "index" | "position">,
  focused: boolean,
  viewportWidth: number,
  dolly = station.index,
): StationFrame {
  const slab = station.kind === "note";
  const width = planeWidth(viewportWidth, focused, slab);
  const unit = xyUnit(viewportWidth);
  return {
    width,
    height: planeHeight(width, slab),
    x: station.position[0] * unit,
    y: -station.position[1] * unit,
    z: stationWorldZ(station.index, dolly),
  };
}
