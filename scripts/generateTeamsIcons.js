// Generates public/icon-color.png (192×192) and public/icon-outline.png (32×32)
// for the Microsoft Teams App Manifest. Uses only Node.js built-ins (no npm).
//
// Run: node scripts/generateTeamsIcons.js

import { deflateSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');

// CRC-32 table for PNG chunk checksums
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(d.length);
  const crcBuf = Buffer.concat([t, d]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, t, d, crc]);
}

// Render each pixel with a callback: (x, y) => [r, g, b]
function makePng(width, height, pixelFn) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);  // bit depth
  ihdr.writeUInt8(2, 9);  // color type: RGB
  // compression, filter, interlace = 0

  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelFn(x, y);
      const off = y * (1 + width * 3) + 1 + x * 3;
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b;
    }
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── icon-color.png — 192×192 ─────────────────────────────────────────────────
// Indigo gradient square (#4f46e5 → #7c3aed) with white "S" letter
const COLOR_W = 192;
const COLOR_H = 192;

// Simple 5×7 bitmap font for "S"
const S_GLYPH = [
  0b11110,
  0b10001,
  0b10000,
  0b11110,
  0b00001,
  0b10001,
  0b11110,
];
const GLYPH_W = 5;
const GLYPH_H = 7;

function sPixel(px, py) {
  // Scale glyph 6× and center
  const scale = 6;
  const ox = Math.floor((COLOR_W - GLYPH_W * scale) / 2);
  const oy = Math.floor((COLOR_H - GLYPH_H * scale) / 2);
  const gx = Math.floor((px - ox) / scale);
  const gy = Math.floor((py - oy) / scale);
  if (gx < 0 || gx >= GLYPH_W || gy < 0 || gy >= GLYPH_H) return false;
  return !!(S_GLYPH[gy] & (1 << (GLYPH_W - 1 - gx)));
}

const colorPng = makePng(COLOR_W, COLOR_H, (x, y) => {
  // Diagonal gradient: indigo (#4f46e5) → violet (#7c3aed)
  const t = (x + y) / (COLOR_W + COLOR_H);
  const r = Math.round(0x4f + t * (0x7c - 0x4f));
  const g = Math.round(0x46 + t * (0x3a - 0x46));
  const b = Math.round(0xe5 + t * (0xed - 0xe5));

  // Rounded corners (radius 36)
  const rx = Math.min(x, COLOR_W - 1 - x);
  const ry = Math.min(y, COLOR_H - 1 - y);
  const R = 36;
  if (rx < R && ry < R) {
    const dx = R - rx - 1, dy = R - ry - 1;
    if (dx * dx + dy * dy > R * R) return [0xff, 0xff, 0xff];
  }

  if (sPixel(x, y)) return [0xff, 0xff, 0xff]; // white "S"
  return [r, g, b];
});

fs.writeFileSync(path.join(PUBLIC, 'icon-color.png'), colorPng);
console.log(`OK icon-color.png (${COLOR_W}×${COLOR_H}, ${colorPng.length} bytes)`);

// ── icon-outline.png — 32×32 ─────────────────────────────────────────────────
// White background with indigo "S" outline — Teams uses this in dark mode UI
const OUT_W = 32;
const OUT_H = 32;

const S_GLYPH_OUT = S_GLYPH;
const GLYPH_W_OUT = GLYPH_W;
const GLYPH_H_OUT = GLYPH_H;

function sPixelOut(px, py) {
  const scale = 3;
  const ox = Math.floor((OUT_W - GLYPH_W_OUT * scale) / 2);
  const oy = Math.floor((OUT_H - GLYPH_H_OUT * scale) / 2);
  const gx = Math.floor((px - ox) / scale);
  const gy = Math.floor((py - oy) / scale);
  if (gx < 0 || gx >= GLYPH_W_OUT || gy < 0 || gy >= GLYPH_H_OUT) return false;
  return !!(S_GLYPH_OUT[gy] & (1 << (GLYPH_W_OUT - 1 - gx)));
}

const outlinePng = makePng(OUT_W, OUT_H, (x, y) => {
  if (sPixelOut(x, y)) return [0x4f, 0x46, 0xe5]; // indigo
  return [0xff, 0xff, 0xff]; // white background
});

fs.writeFileSync(path.join(PUBLIC, 'icon-outline.png'), outlinePng);
console.log(`OK icon-outline.png (${OUT_W}×${OUT_H}, ${outlinePng.length} bytes)`);
