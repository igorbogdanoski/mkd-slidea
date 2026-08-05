// OG Image PNG Generator — Node.js serverless (NOT Edge — WASM needs Node)
// GET /api/og-png?type=template&title=...&subject=...&grade=...
// GET /api/og-png?type=event&title=...&code=...
// GET /api/og-png  (default branded)
//
// Uses satori (HTML→SVG) + @resvg-js/resvg-wasm (SVG→PNG).
// Returns proper PNG 1200×630 — compatible with Facebook, LinkedIn, Twitter.

import satori from 'satori';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { createRequire } from 'module';
import { kv } from '@vercel/kv';

const require = createRequire(import.meta.url);

// Response is already CDN-cached for 24h (s-maxage below), so this only
// limits *distinct* query-param combinations per IP, not repeat requests for
// the same image — still worth capping since each miss runs a real
// satori+resvg render.
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;
const rateFallback = new Map();

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || 'unknown';
}

async function checkRate(ip) {
  const bucket = Math.floor(Date.now() / RATE_WINDOW_MS);
  const key = `rate:og-png:${ip}:${bucket}`;
  try {
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, Math.ceil(RATE_WINDOW_MS / 1000));
    return count <= RATE_LIMIT;
  } catch {
    const now = Date.now();
    const entry = rateFallback.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
    if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + RATE_WINDOW_MS; }
    entry.count++;
    rateFallback.set(ip, entry);
    return entry.count <= RATE_LIMIT;
  }
}

// ─── WASM init (once per cold start) ─────────────────────────────────────────
let wasmReady = false;
async function ensureWasm() {
  if (wasmReady) return;
  const wasmPath = require.resolve('@resvg/resvg-wasm/index_bg.wasm');
  await initWasm(readFileSync(wasmPath));
  wasmReady = true;
}

// ─── Font (Noto Sans Bold + Regular, read from disk once per cold start) ──────
// These used to be fetched from fonts.gstatic.com on every cold start. Google
// rotated those Inter v13 URLs and they now return 404 — an HTML error page,
// which satori dutifully tried to parse as a font ("Unsupported OpenType
// signature <!DO") and threw on. Result: /api/og-png returned 500 for every
// request, so every share of the homepage, /templates, any template detail
// page or a live event went out with no image at all.
//
// The fix is not a better URL — it is not depending on a third party at render
// time. The fonts are committed under api/_lib/fonts (OFL, see LICENSE.txt
// there) and listed in vercel.json's includeFiles so tracing can't drop them.
// Noto Sans also actually covers Cyrillic, which the old latin Inter subset
// did not — Macedonian titles would have rendered as blanks even when it worked.
const LIB_DIR = (() => {
  try {
    return fileURLToPath(new URL('./_lib/', import.meta.url));
  } catch {
    // Test runners (vite-node) serve modules over http:, so import.meta.url is
    // not a file URL there. Fall back to the repo-relative path so the render
    // can still be exercised in unit tests.
    return join(process.cwd(), 'api', '_lib');
  }
})();
const FONT_DIR = join(LIB_DIR, 'fonts');
let fontBold = null;
let fontRegular = null;
async function loadFonts() {
  if (fontBold && fontRegular) return;
  fontBold = fontBold || readFileSync(join(FONT_DIR, 'NotoSans-Bold.ttf'));
  fontRegular = fontRegular || readFileSync(join(FONT_DIR, 'NotoSans-Regular.ttf'));
}

// ─── Color map ────────────────────────────────────────────────────────────────
const COLORS = {
  'Математика': '#6366f1', 'Физика': '#8b5cf6', 'Хемија': '#0ea5e9',
  'Биологија': '#10b981', 'Историја': '#f59e0b', 'Географија': '#14b8a6',
  'Јазик': '#f43f5e', 'Информатика': '#3b82f6',
};
const accentOf = (s = '') => {
  for (const [k, v] of Object.entries(COLORS)) if (s.includes(k)) return v;
  return '#6366f1';
};

const truncate = (s = '', n = 52) => s.length > n ? s.slice(0, n - 1) + '…' : s;

// ─── Element builders (plain objects — no JSX) ────────────────────────────────
const div = (style, children) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } });
const text = (style, content) => ({ type: 'span', props: { style, children: String(content) } });

function templateEl(title, subject, grade) {
  const accent = accentOf(subject);
  const t = truncate(title || 'MKD Slidea');
  const fs = t.length > 36 ? 52 : 64;
  return div({
    width: 1200, height: 630, flexDirection: 'column',
    background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)',
    padding: '48px 64px', fontFamily: 'Noto Sans',
  }, [
    // Header row
    div({ alignItems: 'center', gap: 16, marginBottom: 'auto' }, [
      div({ width: 52, height: 52, background: accent, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, [
        text({ fontSize: 30, fontWeight: 700, color: '#fff' }, 'S'),
      ]),
      text({ fontSize: 24, fontWeight: 700, color: '#fff' }, 'MKD Slidea'),
    ]),
    // Tags
    div({ gap: 12, marginBottom: 24 }, [
      subject && div({
        background: accent + '22', border: `1.5px solid ${accent}88`,
        borderRadius: 999, padding: '6px 18px',
      }, [text({ fontSize: 18, fontWeight: 700, color: accent }, subject)]),
      grade && div({
        background: '#ffffff10', border: '1.5px solid #ffffff25',
        borderRadius: 999, padding: '6px 18px',
      }, [text({ fontSize: 18, fontWeight: 700, color: '#9ca3af' }, grade)]),
    ].filter(Boolean)),
    // Title
    text({ fontSize: fs, fontWeight: 700, color: '#fff', lineHeight: 1.15, letterSpacing: -1, maxWidth: 920 }, t),
    // Footer
    div({ marginTop: 'auto', borderTop: '2px solid #ffffff10', paddingTop: 24, alignItems: 'center' }, [
      text({ fontSize: 18, color: '#6b7280', marginLeft: 'auto' }, 'slidea.mismath.net/templates'),
    ]),
  ]);
}

function eventEl(title, code) {
  const t = truncate(title || 'Интерактивна сесија');
  const fs = t.length > 36 ? 52 : 64;
  return div({
    width: 1200, height: 630, flexDirection: 'column',
    background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%)',
    padding: '48px 64px', fontFamily: 'Noto Sans',
  }, [
    div({ alignItems: 'center', gap: 16, marginBottom: 'auto' }, [
      div({ width: 52, height: 52, background: '#6366f1', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, [
        text({ fontSize: 30, fontWeight: 700, color: '#fff' }, 'S'),
      ]),
      text({ fontSize: 24, fontWeight: 700, color: '#fff' }, 'MKD Slidea'),
    ]),
    div({
      background: '#6366f122', border: '1.5px solid #6366f144',
      borderRadius: 999, padding: '8px 20px', marginBottom: 24,
      // Column parent stretches its children, so without this the pill spans
      // the full card width. `width: 'fit-content'` is not valid in satori.
      alignSelf: 'flex-start', alignItems: 'center', gap: 10,
    }, [
      // Drawn, not an emoji: the bundled font has no emoji glyphs, so 🔴
      // rasterised as a .notdef box in the middle of the badge.
      div({ width: 12, height: 12, borderRadius: 999, background: '#ef4444' }, []),
      text({ fontSize: 18, fontWeight: 700, color: '#818cf8' }, 'Live сесија'),
    ]),
    text({ fontSize: fs, fontWeight: 700, color: '#fff', lineHeight: 1.15, letterSpacing: -1, maxWidth: 920, marginBottom: 28 }, t),
    code && div({ alignItems: 'center', gap: 12 }, [
      text({ fontSize: 22, fontWeight: 700, color: '#6b7280', letterSpacing: 3 }, 'КОД:'),
      text({ fontSize: 36, fontWeight: 700, color: '#a5b4fc', letterSpacing: 8 }, code),
    ]),
    div({ marginTop: 'auto', borderTop: '2px solid #ffffff10', paddingTop: 24, alignItems: 'center' }, [
      text({ fontSize: 18, color: '#6b7280', marginLeft: 'auto' }, 'slidea.mismath.net'),
    ]),
  ].filter(Boolean));
}

function defaultEl() {
  return div({
    width: 1200, height: 630, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)',
    padding: '0 64px', fontFamily: 'Noto Sans',
  }, [
    div({ width: 96, height: 96, background: '#6366f1', borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }, [
      text({ fontSize: 56, fontWeight: 700, color: '#fff' }, 'S'),
    ]),
    text({ fontSize: 80, fontWeight: 700, color: '#fff', letterSpacing: -3, marginBottom: 16 }, 'MKD Slidea'),
    text({ fontSize: 28, color: '#9ca3af', textAlign: 'center', maxWidth: 700, lineHeight: 1.5, marginBottom: 48 }, 'Интерактивна платформа за настава на македонски јазик'),
    div({ gap: 16 }, [
      ['Квизови', 'Анкети', 'AI Генерирање', 'Live Резултати'].map(tag =>
        div({ background: '#ffffff10', border: '1px solid #ffffff20', borderRadius: 999, padding: '10px 24px' }, [
          text({ fontSize: 18, fontWeight: 700, color: '#d1d5db' }, tag),
        ])
      ),
    ]),
  ]);
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  try {
    const allowed = await checkRate(getClientIp(req));
    if (!allowed) {
      res.status(429).send('Too many requests');
      return;
    }

    const url     = new URL(req.url, `https://${req.headers.host}`);
    const type    = url.searchParams.get('type') || 'default';
    const title   = url.searchParams.get('title') || '';
    const subject = url.searchParams.get('subject') || '';
    const grade   = url.searchParams.get('grade') || '';
    const code    = url.searchParams.get('code') || '';

    await Promise.all([ensureWasm(), loadFonts()]);

    const fonts = [];
    if (fontBold)    fonts.push({ name: 'Noto Sans', data: fontBold,    weight: 700, style: 'normal' });
    if (fontRegular) fonts.push({ name: 'Noto Sans', data: fontRegular, weight: 400, style: 'normal' });

    let el;
    if (type === 'template') el = templateEl(title, subject, grade);
    else if (type === 'event') el = eventEl(title, code);
    else el = defaultEl();

    const svg = await satori(el, { width: 1200, height: 630, fonts });
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const png = resvg.render().asPng();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(png);
  } catch (err) {
    // A share preview is not worth a 500. Facebook, LinkedIn and Viber all
    // treat a failed og:image as "no image" and cache that verdict, so a bad
    // minute here costs impressions long after the bug is fixed. Serve the
    // committed branded card instead and let the render error be a log line.
    console.error('og-png render failed, serving static fallback:', err.message);
    try {
      const fallback = readFileSync(join(LIB_DIR, 'og-fallback.png'));
      res.setHeader('Content-Type', 'image/png');
      // Deliberately short: a fallback must not be cached for a day at the CDN
      // the way a real render is, or fixing the renderer wouldn't change what
      // crawlers see.
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(fallback);
    } catch {
      res.status(500).send(`PNG Error: ${err.message}`);
    }
  }
}
