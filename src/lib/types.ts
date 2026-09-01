export type LocaleText = {
  he: string;
  en: string;
};

export type WorkKind = "short" | "series";

export type Work = {
  slug: string;
  youtubeId: string;
  featured?: boolean;
  year: number;
  kind: WorkKind;
  title: LocaleText;
  summary?: LocaleText;
};

export type WritingNote = {
  slug: string;
  date: string;
  title: LocaleText;
  content: string;
};
