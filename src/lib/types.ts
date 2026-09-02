export type LocaleText = {
  he: string;
  en: string;
};

export type FilmKind = "short" | "series";
export type LinkedKind = "game" | "build";
export type WorkKind = FilmKind | LinkedKind;

type WorkBase = {
  slug: string;
  featured?: boolean;
  year: number;
  title: LocaleText;
  summary?: LocaleText;
};

export type FilmWork = WorkBase & {
  kind: FilmKind;
  youtubeId: string;
};

export type LinkedWork = WorkBase & {
  kind: LinkedKind;
  href: string;
  repo?: string;
  kicker?: string;
};

export type Work = FilmWork | LinkedWork;

export function isFilmKind(kind: WorkKind): kind is FilmKind {
  return kind === "short" || kind === "series";
}

export function isLinkedKind(kind: WorkKind): kind is LinkedKind {
  return kind === "game" || kind === "build";
}

export function isFilmWork(work: Work): work is FilmWork {
  return isFilmKind(work.kind);
}

export type WritingNote = {
  slug: string;
  date: string;
  title: LocaleText;
  content: string;
};
