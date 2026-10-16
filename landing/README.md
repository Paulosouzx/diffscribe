# Diffscribe — landing page

Public site for this MCP server, live at [diffscribe.dev](https://diffscribe.dev).

TanStack Start + React 19 + Vite + Tailwind v4, prerendered to static HTML.

```bash
npm install
npm run dev        # http://localhost:5199
npm run build      # static output in dist/client
npm run og         # regenerate public/og-image.png (needs a running build on :4173)
```

## Hero background

The hero uses a `<canvas>` scene (`src/lib/docMonolith.ts`). To use a video
instead, set `HERO_VIDEO_SRC` in `src/components/HeroBackground.tsx`, e.g.
`import video from "../assets/hero.mp4?url"`. The reveal starts when the
background is ready, with a 5s fallback.

## Deploy

Vercel builds from the repo root using `../vercel.json` (install, build and
output directory are set there), so the project needs no Root Directory setting.
