import fs from "node:fs";
import path from "node:path";
import type { LocaleText, Work, WorkKind } from "@/lib/types";

const WORKS_DIR = path.join(process.cwd(), "content/works");

function isLocaleText(value: unknown): value is LocaleText {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.he === "string" && typeof record.en === "string";
}

function isWorkKind(value: unknown): value is WorkKind {
  return value === "short" || value === "series";
}

function parseWork(raw: unknown, fileName: string): Work {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Invalid work file: ${fileName}`);
  }

  const record = raw as Record<string, unknown>;
  const slug = typeof record.slug === "string" ? record.slug : undefined;
  const youtubeId =
    typeof record.youtubeId === "string" ? record.youtubeId : undefined;
  const year = typeof record.year === "number" ? record.year : undefined;

  if (!slug || !youtubeId || year === undefined || !isWorkKind(record.kind)) {
    throw new Error(`Missing required fields in ${fileName}`);
  }
  if (!isLocaleText(record.title)) {
    throw new Error(`Work ${fileName} needs bilingual title.he and title.en`);
  }

  const work: Work = {
    slug,
    youtubeId,
    year,
    kind: record.kind,
    title: record.title,
  };

  if (record.featured === true) {
    work.featured = true;
  }
  if (isLocaleText(record.summary)) {
    work.summary = record.summary;
  }

  return work;
}

function compareWorks(a: Work, b: Work): number {
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
