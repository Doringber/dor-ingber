export const STATION_KICKERS = {
  film: "FILM",
  game: "GAME",
  build: "BUILD",
  note: "NOTE",
} as const;

export type StationKind = keyof typeof STATION_KICKERS;
export type KickerWord = (typeof STATION_KICKERS)[StationKind];
export type StationKicker = `${KickerWord} · ${string}`;

export const LINKED_FACES = {
  findmywatermalon: {
    kicker: "GAME",
    still: "/stills/findmywatermalon.jpg",
  },
  thinkingbreak: {
    kicker: "GAME",
    still: "/stills/thinkingbreak.jpg",
  },
  "vintage-market": {
    kicker: "BUILD",
    still: "/stills/vintage-market.jpg",
  },
} as const;

export type LinkedSlug = keyof typeof LINKED_FACES;

export function isLinkedSlug(slug: string): slug is LinkedSlug {
  return slug in LINKED_FACES;
}

export function formatKindNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function kickerWord(station: {
  kind: StationKind;
  slug: string;
}): KickerWord {
  if (isLinkedSlug(station.slug)) {
    return LINKED_FACES[station.slug].kicker;
  }
  return STATION_KICKERS[station.kind];
}

export function numberedKicker(word: KickerWord, indexInKind: number): StationKicker {
  return `${word} · ${formatKindNumber(indexInKind)}`;
}

export function createKickerCounter(): (station: {
  kind: StationKind;
  slug: string;
}) => StationKicker {
  const counts: Record<KickerWord, number> = {
    FILM: 0,
    GAME: 0,
    BUILD: 0,
    NOTE: 0,
  };

  return (station) => {
    const word = kickerWord(station);
    const index = counts[word];
    counts[word] += 1;
    return numberedKicker(word, index);
  };
}

export function numberKickersByKind<T extends { kind: StationKind; slug: string }>(
  stations: readonly T[],
): Array<T & { kicker: StationKicker }> {
  const next = createKickerCounter();
  return stations.map((station) => ({
    ...station,
    kicker: next(station),
  }));
}

export function planeKicker(
  station: { kind: StationKind; slug: string },
  indexInKind = 0,
): StationKicker {
  return numberedKicker(kickerWord(station), indexInKind);
}

export function linkedStillSrc(slug: string): string | null {
  if (!isLinkedSlug(slug)) {
    return null;
  }
  return LINKED_FACES[slug].still;
}
