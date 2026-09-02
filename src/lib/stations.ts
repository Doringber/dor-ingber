import type { LocaleText, Work, WritingNote } from "@/lib/types";
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

export type SpatialStation = FilmStation | NoteStation;

const FILM_POSES: ReadonlyArray<{
  position: [number, number, number];
  size: [number, number];
}> = [
  { position: [1.55, 0.28, -4.0], size: [3.2, 1.8] },
  { position: [-1.35, 0.42, -7.4], size: [2.7, 1.52] },
  { position: [-2.85, 0.62, -10.8], size: [2.3, 1.29] },
];

const NOTE_POSES: ReadonlyArray<{
  position: [number, number, number];
  size: [number, number];
}> = [
  { position: [3.35, 0.1, -6.2], size: [1.2, 2.05] },
  { position: [-4.05, 0.18, -9.0], size: [1.2, 2.05] },
];

export function buildStations(
  works: Work[],
  notes: WritingNote[],
): SpatialStation[] {
  const films: SpatialStation[] = works.slice(0, 3).map((work, index) => {
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

  const slabs: SpatialStation[] = notes.slice(0, 2).map((note, index) => {
    const pose = NOTE_POSES[index] ?? NOTE_POSES[NOTE_POSES.length - 1];
    return {
      kind: "note",
      index: films.length + index,
      slug: note.slug,
      title: note.title,
      date: note.date,
      content: note.content,
      noteNumber: formatNoteNumber(index),
      position: pose.position,
      size: pose.size,
    };
  });

  return [...films, ...slabs];
}

export function firstNoteIndex(stations: SpatialStation[]): number {
  const index = stations.findIndex((station) => station.kind === "note");
  return index === -1 ? 0 : index;
}

export function stationLabel(station: SpatialStation): string {
  return `${station.title.he} / ${station.title.en}`;
}

export function snapDolly(value: number, count: number): number {
  return Math.min(Math.max(count - 1, 0), Math.max(0, Math.round(value)));
}
