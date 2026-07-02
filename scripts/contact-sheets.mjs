// Build contact-sheet montages of all source paintings so they can be reviewed
// at a glance and categorized by theme. Also reports exact-duplicate files.
import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = path.resolve(process.argv[2] || 'painting');
const OUT = path.resolve('scratch-sheets');
const PREFIX = process.argv[3] || 'sheet';
const COLS = 5;
const CELL = 320;      // cell size in px
const PAD = 10;
const LABEL_H = 26;
const PER_SHEET = 20;  // 5 x 4

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC))
  .filter((f) => /\.jpe?g$/i.test(f))
  .sort();

// Detect exact duplicates by content hash.
const hashes = new Map();
const unique = [];
const dupes = [];
for (const f of files) {
  const buf = await readFile(path.join(SRC, f));
  const h = createHash('md5').update(buf).digest('hex');
  if (hashes.has(h)) {
    dupes.push({ file: f, sameAs: hashes.get(h) });
  } else {
    hashes.set(h, f);
    unique.push(f);
  }
}

console.log(`Total files: ${files.length}`);
console.log(`Unique: ${unique.length}`);
console.log(`Exact duplicates (${dupes.length}):`);
for (const d of dupes) console.log(`  ${d.file}  ==  ${d.sameAs}`);
await writeFile(
  path.join(OUT, 'duplicates.json'),
  JSON.stringify({ unique, dupes }, null, 2)
);

const cellW = CELL;
const cellH = CELL + LABEL_H;

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const sheets = chunk(unique, PER_SHEET);
let sheetNum = 0;
for (const group of sheets) {
  sheetNum++;
  const rows = Math.ceil(group.length / COLS);
  const W = COLS * cellW + PAD * (COLS + 1);
  const H = rows * cellH + PAD * (rows + 1);

  const composites = [];
  for (let i = 0; i < group.length; i++) {
    const f = group[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (cellW + PAD);
    const y = PAD + row * (cellH + PAD);

    const thumb = await sharp(path.join(SRC, f))
      .resize(CELL, CELL, { fit: 'contain', background: '#ffffff' })
      .jpeg({ quality: 82 })
      .toBuffer();
    composites.push({ input: thumb, left: x, top: y });

    // label with filename
    const label = Buffer.from(
      `<svg width="${cellW}" height="${LABEL_H}"><rect width="100%" height="100%" fill="#111"/><text x="6" y="18" font-family="monospace" font-size="15" fill="#fff">${f.replace('.jpeg', '')}</text></svg>`
    );
    composites.push({ input: label, left: x, top: y + CELL });
  }

  const outFile = path.join(OUT, `${PREFIX}-${sheetNum}.jpeg`);
  await sharp({
    create: { width: W, height: H, channels: 3, background: '#dddddd' },
  })
    .composite(composites)
    .jpeg({ quality: 78 })
    .toFile(outFile);
  console.log(`Wrote ${outFile} (${group.length} images)`);
}
