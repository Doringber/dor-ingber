import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { LocaleText, WritingNote } from "@/lib/types";

const WRITING_DIR = path.join(process.cwd(), "content/writing");

function isLocaleText(value: unknown): value is LocaleText {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.he === "string" && typeof record.en === "string";
}

function parseNote(fileName: string, file: string): WritingNote {
  const { data, content } = matter(file);
  const fromFile = fileName.replace(/\.mdx$/, "");
  const slug = typeof data.slug === "string" ? data.slug : fromFile;
  const date = typeof data.date === "string" ? data.date : undefined;

  if (!date) {
    throw new Error(`Writing ${fileName} is missing date`);
  }
  if (!isLocaleText(data.title)) {
    throw new Error(`Writing ${fileName} needs bilingual title.he and title.en`);
  }

  return {
    slug,
    date,
    title: data.title,
    content: content.trim(),
  };
}

function compareNotes(a: WritingNote, b: WritingNote): number {
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1;
  }
  return a.slug.localeCompare(b.slug);
}

export function getWriting(): WritingNote[] {
  if (!fs.existsSync(WRITING_DIR)) {
    return [];
  }

  return fs
    .readdirSync(WRITING_DIR)
    .filter((fileName) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const filePath = path.join(WRITING_DIR, fileName);
      return parseNote(fileName, fs.readFileSync(filePath, "utf8"));
    })
    .sort(compareNotes);
}

export function getWritingBySlug(slug: string): WritingNote | undefined {
  return getWriting().find((note) => note.slug === slug);
}

export function getWritingIndex(slug: string): number {
  const index = getWriting().findIndex((note) => note.slug === slug);
  return index === -1 ? 0 : index;
}

export function formatNoteNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function formatNoteDate(date: string): string {
  return date.replace(/-/g, ".");
}
