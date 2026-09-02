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

const FILM_POSES: ReadonlyArray<{
  position: [number, number, number];
  size: [number, number];
}> = [
  { position: [1.55, 0.28, -4.0], size: [3.2, 1.8] },
  { position: [-1.35, 0.42, -7.4], size: [2.7, 1.52] },
  { position: [-2.85, 0.62, -10.8], size: [2.3, 1.29] },
];

const LINK_POSES: ReadonlyArray<{
  position: [number, number, number];
  size: [number, number];
}> = [
  { position: [1.75, 0.3, -14.2], size: [2.7, 1.52] },
  { position: [-1.55, 0.44, -17.6], size: [2.5, 1.41] },
  { position: [2.05, 0.26, -21.0], size: [2.3, 1.29] },
];

const NOTE_POSES: ReadonlyArray<{
  position: [number, number, number];
  size: [number, number];
}> = [
  { position: [3.15, 0.1, -24.4], size: [1.2, 2.05] },
  { position: [-3.85, 0.18, -27.8], size: [1.2, 2.05] },
];

const LINK_SLUG_ORDER = ["findmywatermalon", "thinkingbreak", "vintage-market"];

export function buildStations(
  works: Work[],
  notes: WritingNote[],
): SpatialStation[] {
  const films: SpatialStation[] = works
    .filter(isFilmWork)
    .slice(0, 3)
    .map((work, index) => {
      const pose = FILM_POSES[index] ?? FILM_POSES[FILM_POSES.length - 1];
      return {
        kind: "film",
        index,
        youtubeId: work.youtubeId,
        title: work.title,
        position: pose.position,
        size: pose.size,
      };
    });

  const links: SpatialStation[] = works
    .filter(isLinkedWork)
    .sort((a, b) => {
      const aOrder = LINK_SLUG_ORDER.indexOf(a.slug);
      const bOrder = LINK_SLUG_ORDER.indexOf(b.slug);
      return (aOrder === -1 ? 99 : aOrder) - (bOrder === -1 ? 99 : bOrder);
    })
    .slice(0, 3)
    .map((work, index) => {
      const pose = LINK_POSES[index] ?? LINK_POSES[LINK_POSES.length - 1];
      return {
        kind: work.kind,
        index: films.length + index,
        href: work.href,
        title: work.title,
        position: pose.position,
        size: pose.size,
      };
    });

  const slabs: SpatialStation[] = notes.slice(0, 2).map((note, index) => {
    const pose = NOTE_POSES[index] ?? NOTE_POSES[NOTE_POSES.length - 1];
    return {
      kind: "note",
      index: films.length + links.length + index,
      slug: note.slug,
      title: note.title,
      date: note.date,
      content: note.content,
      noteNumber: formatNoteNumber(index),
      position: pose.position,
      size: pose.size,
    };
  });

  return [...films, ...links, ...slabs];
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
