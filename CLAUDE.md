# CLAUDE.md

Guidance for working in this repo.

## What this is

A portfolio website for **Wade Norman**, a watercolor painter in Santa Barbara, CA
("Wade Norman Watercolors"). Single-page static site: hero → story/about → filterable
gallery with lightbox → inquiries/commissions form → footer. Repo:
https://github.com/mummysboy/wnw

## Stack

- **Astro** (v4) static site — outputs plain HTML/CSS/JS to `dist/`, no server.
- **Sharp** for build-time image optimization (webp/avif, responsive `srcset`, lazy-load).
- Fonts self-hosted via **Fontsource** (`@fontsource/cormorant-garamond`,
  `@fontsource-variable/source-sans-3`) — **no external CDN calls; keep it that way.**

## Commands

```bash
npm run dev        # dev server at http://localhost:4321
npm run build      # static build → dist/
npm run preview    # serve the production build
npm run prep       # re-process source photos → src/assets/paintings/ (scripts/prep-images.mjs)
npm run sheets     # build review contact-sheets into scratch-sheets/ (dev aid)
```

## Layout

```
painting/                  source photos of the paintings (originals)
wade/                      source photos of the artist
src/assets/paintings/      cleaned/cropped images the gallery uses (built by npm run prep)
src/assets/artist/         artist photos; wade-painting.jpg is the one shown in Story
src/data/paintings.json    gallery list: { file, title, category } — the source of truth
src/components/            Hero, Story, Gallery, Contact, Footer (.astro)
src/layouts/Base.astro     <head>, fonts, global CSS import, scroll-reveal + skip-link
src/styles/global.css      design tokens (CSS custom properties) + base styles
scripts/                   prep-images.mjs, contact-sheets.mjs
```

## Conventions

- **Design tokens** live as CSS custom properties in `src/styles/global.css` (`--paper`,
  `--terracotta`, `--coast`, `--ink`, fonts, spacing). The palette is sampled from the
  paintings — reuse these vars, don't hardcode new colors.
- **Component styles** are scoped `<style>` blocks inside each `.astro` file.
- **Gallery categories**: `coast`, `harbors`, `country`, `villages`, `studies`. Labels are
  defined in `Gallery.astro` (`CATEGORIES`). The gallery loads images via
  `import.meta.glob('../assets/paintings/*.jpg')` and matches them to `paintings.json` by
  filename, so every entry's `file` must exist in `src/assets/paintings/`.
- **Adding a painting**: drop the image in `src/assets/paintings/` (or add to `painting/`
  and run `npm run prep`), then add one line to `src/data/paintings.json`.
- **Accessibility**: every painting needs alt text; the lightbox is keyboard-navigable
  (Esc/arrows) and the skip-link must stay working — preserve these when editing Gallery.

## Image pipeline (scripts/prep-images.mjs)

De-dupes source photos by content hash (prefers clean filenames over `" 2"` copies),
adaptively trims uniform paper/black borders (higher threshold for dark backings) with a
safety cap so it never eats into a painting, then writes optimized JPGs to
`src/assets/paintings/`. Astro does the final webp/avif optimization at build.

## Gotchas / current state

- **Placeholders to replace before a real launch** (see README):
  - Painting **titles** in `paintings.json` are descriptive placeholders.
  - The **bio/artist statement** in `Story.astro` is a draft written from Wade's public
    voice — confirm facts with Wade.
  - `Contact.astro` has `FORM_ENDPOINT` and `CONTACT_EMAIL` placeholders — wire to a free
    Formspree/Netlify Forms endpoint + Wade's real email.
- **Excluded paintings**: `IMG_2458` and `IMG_2459` are signed **"G.G." not "W. Norman"**
  and are intentionally excluded from the gallery (see `EXCLUDE` in prep-images.mjs).
  Confirm with Wade before adding them.
- Not yet deployed to a host; not connected to a live domain.
