# Wade Norman Watercolors

A portfolio website for Santa Barbara watercolor painter **Wade Norman** — showcasing
his paintings, telling his story, and inviting inquiries and commissions.

Built with [Astro](https://astro.build) as a fast, fully static site. All images are
optimized at build time; all fonts are self-hosted (no external CDN calls).

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs static site to ./dist
npm run preview    # preview the production build
```

## How it's organized

```
painting/                  original painting photos (source)
src/assets/paintings/      cleaned, cropped images used by the site
src/data/paintings.json    the gallery list: file → title + category
src/components/            Hero, Story, Gallery (+ lightbox), Contact, Footer
src/pages/index.astro      the single page
scripts/prep-images.mjs    re-crops/optimizes the source photos
scripts/contact-sheets.mjs builds review montages (dev aid)
```

### Adding or changing a painting

1. Drop a photo into `src/assets/paintings/` (or re-run `npm run prep` after adding it
   to the `painting/` source folder).
2. Add one line to `src/data/paintings.json`:
   ```json
   { "file": "IMG_1234.jpg", "title": "Your Title", "category": "coast" }
   ```
   Categories: `coast`, `harbors`, `country`, `villages`, `studies`.
3. Rebuild.

## ⚠️ Before launch — replace the placeholders

- **Painting titles** in `src/data/paintings.json` are tasteful *placeholders* Claude
  wrote from the images. Have Wade rename any he wants.
- **Bio & artist statement** (`src/components/Story.astro`) is a *draft* written from
  Wade's public voice — for him to approve/edit. Facts to confirm: years painting,
  self-taught vs. trained, why watercolor.
- **Portrait**: the Story section currently uses a painting as a stand-in. Swap
  `src/assets/paintings/IMG_2463.jpg` for a photo of Wade when available.
- **Contact form** (`src/components/Contact.astro`): set `FORM_ENDPOINT` to a free
  [Formspree](https://formspree.io) or Netlify Forms endpoint, and `CONTACT_EMAIL` to
  Wade's real email.
- **Two excluded paintings**: `IMG_2458.jpg` (a harbor) and `IMG_2459.jpg` (a flower
  still-life) are signed **"G.G.", not "W. Norman"**, and were left out of the gallery.
  Confirm with Wade whether they're his before adding them back.

## Deploy

Any static host works (all free tiers): Netlify, Vercel, Cloudflare Pages, GitHub Pages.
Point it at this repo; build command `npm run build`, output directory `dist`.
Update `site` in `astro.config.mjs` to the real domain.
