export const STATION_KICKERS = {
  film: "FILM",
  game: "GAME",
  build: "BUILD",
  note: "NOTE",
} as const;

export type StationKind = keyof typeof STATION_KICKERS;
export type StationKicker = (typeof STATION_KICKERS)[StationKind];

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

export function kickerForKind(kind: StationKind): StationKicker {
  return STATION_KICKERS[kind];
}

export function planeKicker(station: {
  kind: StationKind;
  slug: string;
}): StationKicker {
  if (isLinkedSlug(station.slug)) {
    return LINKED_FACES[station.slug].kicker;
  }
  return kickerForKind(station.kind);
}

export function linkedStillSrc(slug: string): string | null {
  if (!isLinkedSlug(slug)) {
    return null;
  }
  return LINKED_FACES[slug].still;
}
