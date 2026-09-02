import {
  isFilmWork,
  isLinkedWork,
  type LocaleText,
  type Work,
  type WritingNote,
} from "@/lib/types";
import { formatNoteNumber } from "@/lib/writing-format";

export const LOOK_CLAMP_RAD = (12 * Math.PI) / 180;
export const FLOOR_Y = -1.42;
export const MOBILE_QUERY = "(max-width: 719px)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type FilmStation = {
  kind: "film";
  index: number;
  youtubeId: string;
  title: LocaleText;
  position: [number, number, number];
  size: [number, number];
};

export type LinkStation = {
  kind: "game" | "build";
  index: number;
  href: string;
  title: LocaleText;
  position: [number, number, number];
  size: [number, number];
};

export type NoteStation = {
  kind: "note";
  index: number;
  slug: string;
  title: LocaleText;
  date: string;
  content: string;
  noteNumber: string;
  position: [number, number, number];
  size: [number, number];
};

export type SpatialStation = FilmStation | LinkStation | NoteStation;

const WIDE: [number, number] = [2.7, 1.52];
const FEATURED: [number, number] = [3.2, 1.8];
const SLAB: [number, number] = [1.2, 2.05];
const XS = [1.55, -1.35, 1.75, -1.55, 2.05, -2.85] as const;
const YS = [0.28, 0.42, 0.3, 0.44, 0.26, 0.62] as const;

function poseAt(
  order: number,
  slab: boolean,
): { position: [number, number, number]; size: [number, number] } {
  const z = -4 - order * 3.4;
  if (slab) {
    return {
      position: [order % 2 === 0 ? 3.15 : -3.85, 0.12, z],
      size: SLAB,
    };
  }
  return {
    position: [XS[order % XS.length], YS[order % YS.length], z],
    size: order === 0 ? FEATURED : WIDE,
  };
}

export function buildStations(
  works: Work[],
  notes: WritingNote[],
): SpatialStation[] {
  const stations: SpatialStation[] = [];
  let order = 0;

  for (const work of works) {
    if (isFilmWork(work)) {
      const pose = poseAt(order, false);
      stations.push({
        kind: "film",
        index: stations.length,
        youtubeId: work.youtubeId,
        title: work.title,
        position: pose.position,
        size: pose.size,
      });
      order += 1;
      continue;
    }
    if (isLinkedWork(work)) {
      const pose = poseAt(order, false);
      stations.push({
        kind: work.kind,
        index: stations.length,
        href: work.href,
        title: work.title,
        position: pose.position,
        size: pose.size,
      });
      order += 1;
    }
  }

  for (const note of notes) {
    const pose = poseAt(order, true);
    stations.push({
      kind: "note",
      index: stations.length,
      slug: note.slug,
      title: note.title,
      date: note.date,
      content: note.content,
      noteNumber: formatNoteNumber(
        stations.filter((station) => station.kind === "note").length,
      ),
      position: pose.position,
      size: pose.size,
    });
    order += 1;
  }

  return stations;
}

export function firstNoteIndex(stations: SpatialStation[]): number {
  const index = stations.findIndex((station) => station.kind === "note");
  return index === -1 ? 0 : index;
}

export function stationLabel(station: SpatialStation): string {
  return `${station.title.he} / ${station.title.en}`;
}

export function stationKicker(station: SpatialStation): string {
  switch (station.kind) {
    case "film":
      return "FILM";
    case "game":
      return "GAME";
    case "build":
      return "BUILD";
    case "note":
      return "NOTE";
  }
}

export function snapDolly(value: number, count: number): number {
  return Math.min(Math.max(count - 1, 0), Math.max(0, Math.round(value)));
}
