// Prepare source painting photos for the site:
//  - skip exact duplicates and the two "G.G."-signed pieces (not Wade's)
//  - conservatively trim uniform paper/backing borders (white or black),
//    with a safety cap so we never eat into the painting
//  - copy the cleaned images into src/assets/paintings/ for Astro to optimize
// Astro's <Image> handles final resize / webp+avif / lazy-loading at build time.
import sharp from 'sharp';
import { readdir, mkdir, rm, writeFile } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const SRC = path.resolve('painting');
const OUT = path.resolve('src/assets/paintings');

// Signed "G.G." — different hand/subject. Excluded from the site; flagged for Wade.
const EXCLUDE = new Set(['IMG_2458.jpeg', 'IMG_2459.jpeg']);

// Max fraction of a dimension trim is allowed to remove before we treat the
// trim as a false positive (border color continued into the painting).
const MAX_TRIM_FRACTION = 0.32;

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => /\.jpe?g$/i.test(f)).sort();

// De-duplicate by content hash, preferring the cleaner filename (no " 2" copy suffix).
const byHash = new Map();
for (const f of files) {
  const h = createHash('md5').update(await readFile(path.join(SRC, f))).digest('hex');
  const existing = byHash.get(h);
  if (!existing || f.length < existing.length) byHash.set(h, f);
}
const unique = [...byHash.values()].sort();

// Average luminance of an image's top-left corner — tells us if the backing is
// dark (needs a more aggressive trim) or light paper.
async function cornerLuma(inPath) {
  const { data } = await sharp(inPath)
    .rotate()
    .extract({ left: 0, top: 0, width: 12, height: 12 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (let i = 0; i < data.length; i += 3) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / (data.length / 3);
}

const report = { kept: [], excluded: [], trimmed: [], trimReverted: [] };

for (const f of unique) {
  if (EXCLUDE.has(f)) {
    report.excluded.push(f);
    continue;
  }
  const inPath = path.join(SRC, f);
  const meta = await sharp(inPath).rotate().metadata();

  // Dark backing (e.g. black cloth) needs a higher threshold than light paper.
  const luma = await cornerLuma(inPath);
  const threshold = luma < 70 ? 50 : 24;

  // Attempt a conservative border trim.
  let trimmedMeta;
  try {
    const buf = await sharp(inPath).rotate().trim({ threshold }).toBuffer();
    trimmedMeta = await sharp(buf).metadata();
  } catch {
    trimmedMeta = null;
  }

  const removedW = trimmedMeta ? 1 - trimmedMeta.width / meta.width : 0;
  const removedH = trimmedMeta ? 1 - trimmedMeta.height / meta.height : 0;
  const overTrim =
    !trimmedMeta ||
    removedW > MAX_TRIM_FRACTION ||
    removedH > MAX_TRIM_FRACTION ||
    trimmedMeta.width < 400 ||
    trimmedMeta.height < 400;

  const outName = f.replace(/\.jpe?g$/i, '.jpg').replace(/\s+/g, '_');
  const outPath = path.join(OUT, outName);

  if (overTrim) {
    // Revert: keep the original (just normalized orientation, high quality).
    await sharp(inPath).rotate().jpeg({ quality: 92 }).toFile(outPath);
    report.trimReverted.push(f);
  } else {
    await sharp(inPath)
      .rotate()
      .trim({ threshold })
      .jpeg({ quality: 92 })
      .toFile(outPath);
    report.trimmed.push({
      file: f,
      removed: `${(removedW * 100).toFixed(0)}%w / ${(removedH * 100).toFixed(0)}%h`,
    });
  }
  report.kept.push(outName);
}

await writeFile(path.resolve('scratch-sheets/prep-report.json'), JSON.stringify(report, null, 2));
console.log(`Unique source images: ${unique.length}`);
console.log(`Kept for site: ${report.kept.length}`);
console.log(`Excluded (G.G., flagged for Wade): ${report.excluded.join(', ')}`);
console.log(`Border-trimmed: ${report.trimmed.length}`);
console.log(`Trim reverted (kept full): ${report.trimReverted.length}`);
