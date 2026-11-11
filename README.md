# Personal portfolio

My personal website: experience, projects, and notes on the films and shows I watch.
built with next.js, with a lot of small details in motion and sound design.

live at [kaificial.vercel.app](https://kaikim.ca)

## Running it locally

```bash
cd website
npm install
npm run dev
```

then open [localhost:3000](http://localhost:3000)

| script          | does                     |
| --------------- | ------------------------ |
| `npm run dev`   | dev server (turbopack)   |
| `npm run build` | production build         |
| `npm run start` | serve the build          |
| `npm run lint`  | eslint                   |

## Pages

- **home**: hero, experience, education, skills, featured projects, github activity, webring
- **projects**: every project with a preview reel, tags, and status
- **notes**: films and shows as a dvd shelf (or list / grid), pulled from letterboxd

## Features

- **theme switch**: dark/light swaps tile by tile in a pixel wave from where you click (view transitions api, with a tiny 1-bit png mask built per switch) 
- **island**: a dynamic-island (iPhone) style pill in the header for music, activity, and status
- **dock**: floating bottom nav that stays usable on small phones
- **command palette**: `⌘K` / `ctrl K`, plus a small terminal (`help`, `ls`, `cd`, `whoami`, ...)
- **sound**: ui sound effects built with the web audio api, can be muted from the dock
- **motion**: framer motion + gsap, lenis smooth scroll, respects reduced motion
- **likes**: a like counter backed by vercel kv, rate limited with upstash

## Project layout

```
website/
├── public/          images, videos, posters
└── src/
    ├── app/         pages (home, projects, notes) and api routes (likes, music)
    ├── components/  ui: header, dock, hero, shelf, terminal, ...
    ├── data/        projects, media, playlist
    ├── lib/         theme transition, letterboxd feed, sound effects
    └── styles/      global scss, palette, motion presets
```

## Environment

optional, only needed for the like counter. without them it just shows 0.

```
KV_REST_API_URL=
KV_REST_API_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Built with

next.js 16 · react 19 · typescript · scss + tailwind · framer motion · gsap · lenis · vercel

---

Made by Kai
