# Dor Ingber

Personal site for AI films and notes.

## Stack

- [Next.js](https://nextjs.org/) App Router
- TypeScript
- Tailwind CSS
- File-based content (no CMS)

Routes: `/` and `/writing/[slug]`.

## Content

Works live in `content/works/*.json`. Notes live in `content/writing/*.mdx`.

Loaders in `src/lib`:

- `getWorks()` / `getWork(slug)`
- `getWriting()` / `getWritingBySlug(slug)`

The homepage shows the first 3 works (featured first, then year) and the first 2 notes by date descending.

### Work JSON

```json
{
  "slug": "hatul-behasger",
  "youtubeId": "o-L6IIDloOE",
  "featured": true,
  "year": 2026,
  "kind": "short",
  "title": { "he": "…", "en": "…" },
  "summary": { "he": "…", "en": "…" }
}
```

Store `youtubeId` only. Posters use `https://i.ytimg.com/vi/{id}/hqdefault.jpg`. Players load `youtube-nocookie` after click.

### Writing MDX

```mdx
---
slug: lockdown-cat
date: "2026-08-27"
title:
  he: חתול בהסגר
  en: Cat in lockdown
---

Hebrew-first body.
```

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build
npm start
```
