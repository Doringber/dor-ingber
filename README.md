# Dor Ingber

Personal site for AI films and notes.

## Stack

- [Next.js](https://nextjs.org/) App Router
- TypeScript
- Tailwind CSS
- File-based content (no CMS)
- [vgpu](https://vgpu.sh) WebGPU volume on `/` (mouse, velocity, scroll, time), with a still CSS one-plane fallback

Routes: `/` and `/writing/[slug]`.

## Content

Works live in `content/works/*.json`. Notes live in `content/writing/*.mdx`.

Loaders in `src/lib`:

- `getWorks()` / `getWork(slug)`
- `getWriting()` / `getWritingBySlug(slug)`

The homepage is a single spatial volume with eight stations in Z: three films, then findmywatermalon (GAME), thinkingbreak (GAME), vintage-market (BUILD), then the two notes. There is no second information architecture.

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
  "href": "https://doringber.github.io/findmywatermalon",
  "repo": "https://github.com/Doringber/findmywatermalon",
  "year": 2026,
  "kicker": "GAME",
  "title": { "he": "…", "en": "…" },
  "summary": { "he": "…", "en": "…" }
}
```

Film posters use `https://i.ytimg.com/vi/{id}/hqdefault.jpg` (proxied at `/api/poster/[id]` for WebGPU). Players load `youtube-nocookie` after click. Game/build stations open the live `href` in the same tab.

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
