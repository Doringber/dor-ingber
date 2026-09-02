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

The homepage is a single spatial volume: three films, then findmywatermalon (GAME), thinkingbreak (GAME), vintage-market (BUILD), then the notes. There is no second information architecture. The volume sits on warm dark `#1C1612`, not pure black. Desktop stations size from the viewport — one hero plane `min(56vw, 960px)` at 16:9 with a lift, neighbors stay at `28vw` and recede at ~0.55 opacity and brightness. Scale and light interpolate with focus while scrolling or dragging. Films are lifted black-and-white; games and builds keep a little tone. Notes are kraft (`#C4A06A` slab, `#D4B48A` reader, `#2C2118` ink), never black slabs. Phone stays one plane. Not the old 78vw / 1280 featured lock or the 2.7 world-unit stamp.

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

Tapping a note slab opens `/writing/[slug]` as a full-bleed paper over the volume. Close, swipe down, or הקודם / הבא to move between notes.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build
npm start
```
