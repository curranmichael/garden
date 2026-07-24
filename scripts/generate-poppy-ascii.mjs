#!/usr/bin/env node
/**
 * Converts scripts/poppy.png into components/home/poppyData.ts: a character
 * grid (glyph per cell by pigment density, palette-indexed color per cell).
 * macOS only — decodes via `sips` to BMP so the repo needs no image deps.
 *
 * The emitted file is meant to be hand-tuned; regenerating overwrites edits.
 * Usage: node scripts/generate-poppy-ascii.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'scripts', 'poppy.png');
const OUT = join(root, 'components', 'home', 'poppyData.ts');

/** Grid width in cells; rows follow from the image and cell aspect. */
const COLS = 56;
/** Cell width / cell height — must match CELL_ASPECT in PoppyAscii.tsx. */
const CELL_ASPECT = 0.55;
/** Mean pigment (0..1, 0 = white/transparent) below which a cell is blank. */
const BLANK_BELOW = 0.07;
/** Light → dense, indexed by normalized pigment. */
const RAMP = ' .:-=+*#%@';
/** Palette size for the emitted color indices (base36 digits). */
const PALETTE_SIZE = 14;

// ---- decode: png -> 32bpp top-down BMP via sips -> {w, h, rgba} ----------

function decode(pngPath) {
  const dir = mkdtempSync(join(tmpdir(), 'poppy-'));
  const bmpPath = join(dir, 'poppy.bmp');
  execFileSync('sips', ['-s', 'format', 'bmp', pngPath, '--out', bmpPath], {
    stdio: 'ignore',
  });
  const bmp = readFileSync(bmpPath);
  rmSync(dir, { recursive: true, force: true });

  const dataOffset = bmp.readUInt32LE(10);
  const w = bmp.readInt32LE(18);
  const hRaw = bmp.readInt32LE(22);
  const bpp = bmp.readUInt16LE(28);
  if (bpp !== 32) throw new Error(`expected 32bpp BMP from sips, got ${bpp}`);
  const h = Math.abs(hRaw);
  const topDown = hRaw < 0;
  const redMask = bmp.readUInt32LE(54);
  // sips emits either RGBA or BGRA byte order; the red mask says which.
  const rIdx = redMask === 0xff ? 0 : 2;

  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const srcY = topDown ? y : h - 1 - y;
    const rowStart = dataOffset + srcY * w * 4;
    for (let x = 0; x < w; x++) {
      const s = rowStart + x * 4;
      const d = (y * w + x) * 4;
      rgba[d] = bmp[s + rIdx];
      rgba[d + 1] = bmp[s + 1];
      rgba[d + 2] = bmp[s + 2 - (rIdx - 0)];
      rgba[d + 3] = bmp[s + 3];
    }
  }
  return { w, h, rgba };
}

// ---- sampling ------------------------------------------------------------

/** Pigment: 1 - luminance after compositing over white. 0 for blank paper. */
function pigmentOf(r, g, b) {
  return 1 - (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function sampleGrid({ w, h, rgba }) {
  const rows = Math.round(COLS * (h / w) * CELL_ASPECT);
  const cells = [];
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < COLS; gx++) {
      const x0 = Math.floor((gx * w) / COLS);
      const x1 = Math.floor(((gx + 1) * w) / COLS);
      const y0 = Math.floor((gy * h) / rows);
      const y1 = Math.floor(((gy + 1) * h) / rows);
      let pigmentSum = 0;
      let n = 0;
      // Color accumulates weighted by pigment so paper-white in the same
      // cell doesn't wash the sampled color toward pink.
      let r = 0, g = 0, b = 0, wsum = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * w + x) * 4;
          const a = rgba[i + 3] / 255;
          const cr = rgba[i] * a + 255 * (1 - a);
          const cg = rgba[i + 1] * a + 255 * (1 - a);
          const cb = rgba[i + 2] * a + 255 * (1 - a);
          const p = pigmentOf(cr, cg, cb);
          pigmentSum += p;
          n++;
          const wgt = p * p;
          r += cr * wgt;
          g += cg * wgt;
          b += cb * wgt;
          wsum += wgt;
        }
      }
      const pigment = n ? pigmentSum / n : 0;
      cells.push({
        gx,
        gy,
        pigment,
        color:
          wsum > 0
            ? [r / wsum, g / wsum, b / wsum]
            : [255, 255, 255],
      });
    }
  }
  return { rows, cells };
}

// ---- color adjustment for the dark page ----------------------------------

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/** Watercolor on white was authored for a light ground; on #161615 the
 *  darkest greens go muddy. Nudge saturation up and floor the lightness. */
function adjustForDarkGround([r, g, b]) {
  const [h, s, l] = rgbToHsl(r, g, b);
  return hslToRgb(h, Math.min(1, s * 1.15), Math.max(l, 0.42));
}

// ---- palette quantization (fixed-seed k-means) ---------------------------

function quantize(colors, k) {
  // Seed centroids from the hue-sorted spread so orange and green both land.
  const sorted = [...colors].sort(
    (a, b) => rgbToHsl(...a)[0] - rgbToHsl(...b)[0],
  );
  let centroids = Array.from({ length: k }, (_, i) => [
    ...sorted[Math.floor((i * (sorted.length - 1)) / (k - 1))],
  ]);
  let assignment = new Array(colors.length).fill(0);
  for (let iter = 0; iter < 16; iter++) {
    assignment = colors.map((c) => {
      let best = 0, bestD = Infinity;
      centroids.forEach((cen, i) => {
        const d =
          (c[0] - cen[0]) ** 2 + (c[1] - cen[1]) ** 2 + (c[2] - cen[2]) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    });
    centroids = centroids.map((cen, i) => {
      const mine = colors.filter((_, j) => assignment[j] === i);
      if (!mine.length) return cen;
      return [0, 1, 2].map(
        (ch) => mine.reduce((s, c) => s + c[ch], 0) / mine.length,
      );
    });
  }
  return { centroids, assignment };
}

const hex = ([r, g, b]) =>
  '#' +
  [r, g, b]
    .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
    .join('');

// ---- main ----------------------------------------------------------------

const img = decode(SRC);
const { rows, cells } = sampleGrid(img);

const inked = cells.filter((c) => c.pigment >= BLANK_BELOW);
// Normalize the ramp to the pigment range actually present.
const maxPigment = Math.max(...inked.map((c) => c.pigment));
const adjusted = inked.map((c) => adjustForDarkGround(c.color));
const { centroids, assignment } = quantize(adjusted, PALETTE_SIZE);

const charGrid = Array.from({ length: rows }, () => new Array(COLS).fill(' '));
const colorGrid = Array.from({ length: rows }, () => new Array(COLS).fill(' '));
inked.forEach((c, i) => {
  const t = (c.pigment - BLANK_BELOW) / (maxPigment - BLANK_BELOW);
  const rampIdx = Math.min(
    RAMP.length - 1,
    Math.max(1, Math.round(t * (RAMP.length - 1))),
  );
  charGrid[c.gy][c.gx] = RAMP[rampIdx];
  colorGrid[c.gy][c.gx] = assignment[i].toString(36);
});

// Despeckle: the watercolor scatters paint dots well clear of the plant.
// Keep the main connected mass plus anything near it (feathery leaf tips
// sit 1-2 cells out); drop small far islands that read as dirt.
{
  const key = (x, y) => y * COLS + x;
  const seen = new Set();
  const components = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < COLS; x++) {
      if (charGrid[y][x] === ' ' || seen.has(key(x, y))) continue;
      const cells = [];
      const stack = [[x, y]];
      seen.add(key(x, y));
      while (stack.length) {
        const [cx, cy] = stack.pop();
        cells.push([cx, cy]);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= COLS || ny >= rows) continue;
            if (charGrid[ny][nx] === ' ' || seen.has(key(nx, ny))) continue;
            seen.add(key(nx, ny));
            stack.push([nx, ny]);
          }
        }
      }
      components.push(cells);
    }
  }
  const main = components.reduce((a, b) => (b.length > a.length ? b : a));
  const nearMain = (cells) =>
    cells.some(([x, y]) =>
      main.some(([mx, my]) => Math.max(Math.abs(mx - x), Math.abs(my - y)) <= 3),
    );
  let dropped = 0;
  for (const cells of components) {
    if (cells === main || cells.length >= 4 || nearMain(cells)) continue;
    for (const [x, y] of cells) {
      charGrid[y][x] = ' ';
      colorGrid[y][x] = ' ';
      dropped++;
    }
  }
  if (dropped) console.log(`despeckled ${dropped} stray cells`);
}

// Trim fully blank border rows/cols so the component gets a tight grid.
const rowUsed = charGrid.map((r) => r.some((ch) => ch !== ' '));
const colUsed = Array.from({ length: COLS }, (_, x) =>
  charGrid.some((r) => r[x] !== ' '),
);
const y0 = rowUsed.indexOf(true), y1 = rowUsed.lastIndexOf(true);
const x0 = colUsed.indexOf(true), x1 = colUsed.lastIndexOf(true);
const trim = (grid) =>
  grid.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1).join(''));

const charRows = trim(charGrid);
const colorRows = trim(colorGrid);

const file = `/**
 * ASCII California poppy, generated by scripts/generate-poppy-ascii.mjs
 * from scripts/poppy.png — hand edits welcome (regenerating overwrites).
 *
 * CHARS is the picture: one string per row, space = empty cell.
 * COLORS holds a base36 PALETTE index per cell, same shape as CHARS.
 * CELL_ASPECT is the cell width/height ratio the grid was sampled at;
 * the renderer must lay glyphs out at the same ratio or the flower warps.
 */
export const CELL_ASPECT = ${CELL_ASPECT};

export const PALETTE: string[] = ${JSON.stringify(centroids.map(hex))};

export const CHARS: string[] = [
${charRows.map((r) => `  ${JSON.stringify(r)},`).join('\n')}
];

export const COLORS: string[] = [
${colorRows.map((r) => `  ${JSON.stringify(r)},`).join('\n')}
];
`;

writeFileSync(OUT, file);
const count = inked.length;
console.log(
  `wrote ${OUT}: ${charRows.length} rows x ${charRows[0].length} cols, ${count} glyphs, ${PALETTE_SIZE} colors`,
);
console.log(charRows.join('\n'));
