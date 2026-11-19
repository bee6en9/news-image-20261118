// generate.mjs — renders the 18 Nov 2026 world-news front page to entry.png
// Hand-written pixel renderer: no external assets, no fonts, no network.
// Node 22+ stdlib only (zlib + fs + url + path).
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const W = 1024;
const H = 1024;

// ---------------- palette ----------------
const PAPER = [253, 250, 240];
const INK = [18, 18, 18];
const WHITE = [255, 255, 255];
const RED = [178, 34, 34];
const DARKRED = [122, 20, 20];

// ---------------- framebuffer ----------------
const img = Buffer.alloc(W * H * 3);
for (let i = 0; i < W * H; i++) {
  img[i * 3] = PAPER[0];
  img[i * 3 + 1] = PAPER[1];
  img[i * 3 + 2] = PAPER[2];
}

function px(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
}
function rect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}
function circle(cx, cy, r, c) {
  for (let j = -r; j <= r; j++)
    for (let i = -r; i <= r; i++)
      if (i * i + j * j <= r * r) px(cx + i, cy + j, c);
}
function ring(cx, cy, r, t, c) {
  for (let j = -r; j <= r; j++)
    for (let i = -r; i <= r; i++) {
      const d = i * i + j * j;
      if (d <= r * r && d >= (r - t) * (r - t)) px(cx + i, cy + j, c);
    }
}
function line(x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    px(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}
function thickLine(x0, y0, x1, y1, w, c) {
  const r = Math.floor(w / 2);
  for (let a = -r; a <= r; a++)
    for (let b = -r; b <= r; b++)
      line(x0 + a, y0 + b, x1 + a, y1 + b, c);
}
function star(cx, cy, r, c) {
  const pts = [];
  for (let k = 0; k < 10; k++) {
    const ang = (-Math.PI / 2) + (k * Math.PI) / 5;
    const rr = k % 2 === 0 ? r : r * 0.45;
    pts.push([Math.round(cx + rr * Math.cos(ang)), Math.round(cy + rr * Math.sin(ang))]);
  }
  for (let k = 0; k < 10; k++) {
    const a = pts[k];
    const b = pts[(k + 1) % 10];
    thickLine(a[0], a[1], b[0], b[1], 3, c);
  }
  circle(cx, cy, Math.max(2, Math.round(r * 0.3)), c);
}

// ---------------- 5x7 bitmap font (embedded) ----------------
// Each glyph: 7 rows of 5 chars, '#' = ink.
const FONT = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#..##', '#.#.#', '##..#', '#...#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '...#.', '..#..', '..#..', '..#..'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.....', '..#..'],
  ',': ['.....', '.....', '.....', '.....', '.....', '..#..', '.#...'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  ':': ['.....', '..#..', '.....', '.....', '.....', '..#..', '.....'],
  '/': ['....#', '...#.', '...#.', '..#..', '..#..', '.#...', '#....'],
  '%': ['#...#', '#..#.', '...#.', '..#..', '.#...', '#..#.', '#...#'],
  "'": ['..#..', '..#..', '.....', '.....', '.....', '.....', '.....'],
  '(': ['...##', '..#..', '.#...', '.#...', '.#...', '..#..', '...##'],
  ')': ['##...', '..#..', '...#.', '...#.', '...#.', '..#..', '##...'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '&': ['.###.', '#...#', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
};

function textWidth(s, scale) {
  return s.length * 6 * scale - scale;
}
function drawText(s, x, y, scale, c) {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = FONT[ch] || FONT['?'];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === '#') rect(cx + col * scale, y + r * scale, scale, scale, c);
      }
    }
    cx += 6 * scale;
  }
  return cx - x;
}
function drawCentered(s, cx, y, scale, c) {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}

// ---------------- PNG encoder (zlib + CRC32) ----------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function writePng(path) {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    img.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
  return png.length;
}

// ---------------- scenes (one per event) ----------------
function sceneGulf(x, y, w, h) {
  const NAVY = [16, 42, 66];
  const SEA = [24, 90, 140];
  rect(x, y, w, h, NAVY);
  // stars
  for (const [sx, sy] of [[18, 14], [60, 30], [120, 10], [200, 24], [260, 12], [330, 28], [400, 16], [455, 34], [90, 44], [300, 44]])
    rect(x + sx, y + sy, 3, 3, WHITE);
  // moon
  circle(x + 52, y + 34, 16, [240, 230, 190]);
  circle(x + 46, y + 30, 13, NAVY);
  // sea
  rect(x, y + h - 42, w, 42, SEA);
  rect(x, y + h - 42, w, 3, [120, 180, 220]);
  // distant base silhouettes on the shore
  rect(x + 20, y + h - 78, 46, 36, [10, 26, 44]);
  rect(x + 74, y + h - 66, 30, 24, [10, 26, 44]);
  rect(x + 112, y + h - 84, 22, 42, [10, 26, 44]);
  // missile trails rising from the sea
  thickLine(x + 150, y + h - 20, x + 250, y + 34, 4, [255, 220, 120]);
  thickLine(x + 210, y + h - 20, x + 330, y + 46, 4, [255, 220, 120]);
  circle(x + 150, y + h - 20, 6, [255, 160, 40]);
  circle(x + 210, y + h - 20, 6, [255, 160, 40]);
  // explosion over the bases
  circle(x + 395, y + 52, 30, [255, 140, 0]);
  circle(x + 395, y + 52, 20, [255, 200, 60]);
  circle(x + 395, y + 52, 10, WHITE);
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    line(x + 395, y + 52, Math.round(x + 395 + 44 * Math.cos(a)), Math.round(y + 52 + 44 * Math.sin(a)), [255, 200, 60]);
  }
  // smoke
  circle(x + 370, y + 22, 10, [120, 120, 120]);
  circle(x + 420, y + 26, 12, [150, 150, 150]);
}

function sceneKerch(x, y, w, h) {
  const SKY = [127, 179, 213];
  const SEA = [30, 100, 160];
  rect(x, y, w, h, SKY);
  circle(x + 420, y + 26, 18, [255, 230, 140]);
  // sea
  rect(x, y + h - 46, w, 46, SEA);
  rect(x, y + h - 46, w, 3, [180, 215, 235]);
  // bridge deck: left part, gap, right part
  const deckY = y + 66;
  thickLine(x + 8, deckY, x + 190, deckY, 7, [60, 60, 60]);
  thickLine(x + 300, deckY, x + w - 8, deckY, 7, [60, 60, 60]);
  // pillars
  rect(x + 40, deckY, 12, h - 46 - 66 + 6, [80, 80, 80]);
  rect(x + 140, deckY, 12, h - 46 - 66 + 6, [80, 80, 80]);
  rect(x + 340, deckY, 12, h - 46 - 66 + 6, [80, 80, 80]);
  rect(x + 430, deckY, 12, h - 46 - 66 + 6, [80, 80, 80]);
  // broken span falling into the sea
  thickLine(x + 196, deckY, x + 245, y + h - 34, 7, [60, 60, 60]);
  // splash
  circle(x + 245, y + h - 40, 12, WHITE);
  circle(x + 228, y + h - 34, 8, WHITE);
  circle(x + 264, y + h - 32, 8, WHITE);
  // smoke over the break
  circle(x + 232, y + 34, 12, [110, 110, 110]);
  circle(x + 254, y + 26, 15, [140, 140, 140]);
  circle(x + 276, y + 36, 10, [110, 110, 110]);
}

function sceneSummit(x, y, w, h) {
  const DUSK = [58, 42, 74];
  rect(x, y, w, h, DUSK);
  circle(x + 60, y + 30, 16, [255, 190, 110]);
  // skyline
  const towers = [[0, 78], [34, 100], [72, 62], [112, 92], [150, 70], [196, 104], [238, 58], [280, 88], [318, 74], [356, 98], [392, 66], [428, 90]];
  for (const [tx, th] of towers) {
    rect(x + tx, y + h - 34 - th, 30, th, [28, 20, 38]);
    for (let wy = y + h - 34 - th + 8; wy < y + h - 40; wy += 14)
      for (let wx = x + tx + 6; wx < x + tx + 26; wx += 10)
        rect(wx, wy, 3, 4, [255, 210, 90]);
  }
  // ground
  rect(x, y + h - 34, w, 34, [30, 25, 40]);
  // two figures shaking hands
  const cy = y + h - 34;
  // figure 1 (left)
  circle(x + 185, cy - 72, 13, [232, 190, 150]);
  rect(x + 172, cy - 58, 26, 58, [96, 96, 122]);
  // figure 2 (right)
  circle(x + 295, cy - 72, 13, [232, 190, 150]);
  rect(x + 282, cy - 58, 26, 58, [96, 96, 122]);
  // arms meeting in a handshake
  thickLine(x + 198, cy - 50, x + 240, cy - 38, 6, [232, 190, 150]);
  thickLine(x + 282, cy - 50, x + 240, cy - 38, 6, [232, 190, 150]);
  circle(x + 240, cy - 38, 6, [232, 190, 150]);
  // flags above
  line(x + 150, cy - 102, x + 150, cy - 58, [220, 220, 220]);
  rect(x + 150, cy - 102, 26, 15, [200, 30, 30]);
  line(x + 330, cy - 102, x + 330, cy - 58, [220, 220, 220]);
  rect(x + 330, cy - 102, 26, 15, [200, 30, 30]);
}

function scenePeltola(x, y, w, h) {
  rect(x, y, w, h, [223, 233, 243]);
  // ballot box
  rect(x + 40, y + 52, 130, 84, [31, 78, 121]);
  rect(x + 40, y + 52, 130, 10, [24, 60, 96]);
  rect(x + 80, y + 46, 50, 6, INK);
  // ballot paper sliding in
  rect(x + 88, y + 16, 34, 34, WHITE);
  rect(x + 88, y + 16, 34, 3, INK);
  rect(x + 94, y + 26, 22, 3, [31, 78, 121]);
  rect(x + 94, y + 33, 22, 3, [31, 78, 121]);
  // big check mark
  thickLine(x + 200, y + 96, x + 224, y + 122, 7, [34, 139, 34]);
  thickLine(x + 224, y + 122, x + 268, y + 58, 7, [34, 139, 34]);
  // big score
  drawText('56-44', x + 300, y + 78, 4, [31, 78, 121]);
  drawText('DEMOCRATS', x + 302, y + 116, 2, INK);
  // small stars
  star(x + 330, y + 24, 12, [255, 200, 40]);
  star(x + 420, y + 40, 9, [255, 200, 40]);
  star(x + 250, y + 16, 8, [255, 200, 40]);
}

function sceneEbola(x, y, w, h) {
  rect(x, y, w, h, [90, 20, 20]);
  const cx = x + Math.floor(w / 2);
  const cy = y + 56;
  // virus spikes
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    const x1 = Math.round(cx + 34 * Math.cos(a));
    const y1 = Math.round(cy + 34 * Math.sin(a));
    const x2 = Math.round(cx + 50 * Math.cos(a));
    const y2 = Math.round(cy + 50 * Math.sin(a));
    thickLine(x1, y1, x2, y2, 4, [220, 60, 60]);
    circle(x2, y2, 5, [220, 60, 60]);
  }
  // virus body
  circle(cx, cy, 36, [200, 40, 40]);
  circle(cx - 10, cy - 8, 8, [140, 20, 20]);
  circle(cx + 12, cy + 6, 6, [140, 20, 20]);
  circle(cx + 2, cy - 16, 5, [140, 20, 20]);
  // big number
  drawCentered('11,000+', cx, y + 112, 3, WHITE);
}

function sceneMeasles(x, y, w, h) {
  rect(x, y, w, h, [242, 230, 184]);
  // face with measles spots
  const cx = x + 120;
  const cy = y + 74;
  circle(cx, cy, 56, [245, 205, 160]);
  circle(cx - 20, cy - 12, 5, INK);
  circle(cx + 20, cy - 12, 5, INK);
  line(cx - 12, cy + 22, cx + 12, cy + 22, INK);
  // red spots
  for (const [sx, sy, sr] of [[-38, 6, 7], [-28, 26, 6], [30, 8, 7], [36, 30, 6], [0, -34, 6], [-6, 38, 5], [18, -28, 5]])
    circle(cx + sx, cy + sy, sr, [200, 40, 40]);
  // prohibition sign: measles-free status lost
  const px0 = x + w - 130;
  const py0 = y + 74;
  ring(px0, py0, 46, 9, RED);
  thickLine(px0 - 32, py0 + 32, px0 + 32, py0 - 32, 9, RED);
  drawCentered('26', px0, py0 - 64, 2, RED);
  drawText('YEARS', px0 - 30, py0 + 56, 2, RED);
}

// ---------------- panel helper ----------------
function panel(x, y, w, h, headerBg, title, scene, captions) {
  rect(x, y, w, h, WHITE);
  rect(x, y, w, 2, INK);
  rect(x, y + h - 2, w, 2, INK);
  rect(x, y, 2, h, INK);
  rect(x + w - 2, y, 2, h, INK);
  rect(x + 2, y + 2, w - 4, 40, headerBg);
  drawText(title, x + 12, y + 14, 2, WHITE);
  scene(x + 2, y + 44, w - 4, 148);
  let cy = y + 44 + 148 + 12;
  for (const ln of captions) {
    drawText(ln, x + 12, cy, 2, INK);
    cy += 22;
  }
}

// ---------------- masthead ----------------
rect(16, 10, 992, 4, INK);
drawCentered('WEDNESDAY 18 NOVEMBER 2026', 512, 26, 4, INK);
rect(16, 84, 992, 2, INK);
drawCentered('THE WORLD IN ONE DAY', 512, 96, 2, RED);
drawCentered('WAR - SUMMITS - SHIFTING GLOBAL POWER', 512, 118, 2, INK);

// ---------------- grid: 2 cols x 3 rows ----------------
const GX = 16;
const GY = 140;
const GAP = 10;
const PW = (1024 - 32 - GAP) / 2; // 491
const PH = 278;
const COLS = [GX, GX + PW + GAP];
const ROWS = [GY, GY + PH + GAP, GY + 2 * (PH + GAP)];

panel(COLS[0], ROWS[0], PW, PH, DARKRED, 'GULF UNDER FIRE', sceneGulf, [
  'IRAN HITS US BASES IN',
  'KUWAIT AND BAHRAIN',
  'AFTER US JET STRIKE ON QESHM',
]);
panel(COLS[1], ROWS[0], PW, PH, [31, 78, 121], 'KERCH BRIDGE HIT', sceneKerch, [
  'UKRAINE HITS BRIDGE AGAIN',
  'ROAD SPAN FALLS INTO SEA',
]);
panel(COLS[0], ROWS[1], PW, PH, [74, 52, 96], 'SHENZHEN SUMMIT', sceneSummit, [
  'XI AND PUTIN MEET BEFORE',
  'THREE-WAY SUMMIT WITH TRUMP',
]);
panel(COLS[1], ROWS[1], PW, PH, [31, 78, 121], 'PELTOLA WINS ALASKA', scenePeltola, [
  'DEMOCRATS TAKE 56-44',
  'SENATE MAJORITY',
]);
panel(COLS[0], ROWS[2], PW, PH, [110, 20, 20], 'EBOLA PASSES 11,000', sceneEbola, [
  'CASES IN DR CONGO TOP',
  '11,000',
]);
panel(COLS[1], ROWS[2], PW, PH, [138, 109, 31], 'MEASLES-FREE NO MORE', sceneMeasles, [
  'US LOSES STATUS AFTER',
  '26 YEARS',
]);

// ---------------- footer ----------------
rect(16, 1002, 992, 2, INK);
drawCentered('ONE DAY OF STRIKES, SUMMITS, AND SHIFTING GLOBAL POWER.', 512, 1008, 1, INK);

// ---------------- write PNG ----------------
const outPath = join(__dirname, 'entry.png');
const size = writePng(outPath);
console.log('wrote ' + outPath + ' (' + size + ' bytes)');
