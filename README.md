# Dor Ingber

Personal site for AI films and notes.

## Stack

- [Next.js](https://nextjs.org/) App Router
- TypeScript
- Tailwind CSS
- File-based content (no CMS)
- WebGPU spatial volume on `/`, with a still one-plane fallback

Routes: `/` and `/writing/[slug]`.

## Content

Works live in `content/works/*.json`. Notes live in `content/writing/*.mdx`.

Loaders in `src/lib`:

- `getWorks()` / `getWork(slug)`
- `getWriting()` / `getWritingBySlug(slug)`

The homepage is a single spatial volume. `getWorks()` returns films first (featured, then year, then slug), then game/build works. Film stations still use the first 3 films; notes stay the first 2 by date descending. There is no second information architecture.

### Work JSON

Films (`short` | `series`) require `youtubeId` and must not use a live `href`:

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

Games and builds (`game` | `build`) require `href` and must not include `youtubeId`:

```json
{
  "slug": "findmywatermalon",
  "kind": "game",
  "href": "https://example.com/play",
  "repo": "https://github.com/example/play",
  "year": 2026,
  "kicker": "GAME",
  "title": { "he": "…", "en": "…" },
  "summary": { "he": "…", "en": "…" }
}
```

Film posters use `https://i.ytimg.com/vi/{id}/hqdefault.jpg` (proxied at `/api/poster/[id]` for WebGPU). Players load `youtube-nocookie` after click.

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

Notes dock over the volume on `/`. `/writing/[slug]` remains the article deep link.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build
npm start
```
