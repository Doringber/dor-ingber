import fs from "node:fs";
import path from "node:path";
import {
  isFilmKind,
  isFilmWork,
  isLinkedKind,
  type FilmWork,
  type LinkedWork,
  type LocaleText,
  type Work,
  type WorkKind,
} from "@/lib/types";

const WORKS_DIR = path.join(process.cwd(), "content/works");

function isLocaleText(value: unknown): value is LocaleText {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.he === "string" && typeof record.en === "string";
}

function isWorkKind(value: unknown): value is WorkKind {
  return (
    value === "short" ||
    value === "series" ||
    value === "game" ||
    value === "build"
  );
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseWork(raw: unknown, fileName: string): Work {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Invalid work file: ${fileName}`);
  }

  const record = raw as Record<string, unknown>;
  const slug = optionalString(record.slug);
  const year = typeof record.year === "number" ? record.year : undefined;

  if (!slug || year === undefined || !isWorkKind(record.kind)) {
    throw new Error(`Missing required fields in ${fileName}`);
  }
  if (!isLocaleText(record.title)) {
    throw new Error(`Work ${fileName} needs bilingual title.he and title.en`);
  }

  const base = {
    slug,
    year,
    title: record.title,
    ...(record.featured === true ? { featured: true as const } : {}),
    ...(isLocaleText(record.summary) ? { summary: record.summary } : {}),
  };

  if (isFilmKind(record.kind)) {
    const youtubeId = optionalString(record.youtubeId);
    if (!youtubeId) {
      throw new Error(`Film work ${fileName} needs youtubeId`);
    }

    const work: FilmWork = {
      ...base,
      kind: record.kind,
      youtubeId,
    };
    return work;
  }

  if (!isLinkedKind(record.kind)) {
    throw new Error(`Missing required fields in ${fileName}`);
  }

  if (optionalString(record.youtubeId)) {
    throw new Error(`Work ${fileName} of kind ${record.kind} must not include youtubeId`);
  }

  const href = optionalString(record.href);
  if (!href) {
    throw new Error(`Work ${fileName} needs href`);
  }

  const work: LinkedWork = {
    ...base,
    kind: record.kind,
    href,
  };

  const repo = optionalString(record.repo);
  if (repo) {
    work.repo = repo;
  }
  const kicker = optionalString(record.kicker);
  if (kicker) {
    work.kicker = kicker;
  }

  return work;
}

function compareWorks(a: Work, b: Work): number {
  if (isFilmWork(a) !== isFilmWork(b)) {
    return isFilmWork(a) ? -1 : 1;
  }
  if (Boolean(a.featured) !== Boolean(b.featured)) {
    return a.featured ? -1 : 1;
  }
  if (a.year !== b.year) {
    return b.year - a.year;
  }
  return a.slug.localeCompare(b.slug);
}

export function getWorks(): Work[] {
  if (!fs.existsSync(WORKS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(WORKS_DIR)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      const filePath = path.join(WORKS_DIR, fileName);
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
      return parseWork(raw, fileName);
    })
    .sort(compareWorks);
}

export function getWork(slug: string): Work | undefined {
  return getWorks().find((work) => work.slug === slug);
}
