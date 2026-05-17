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
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ─── WASM init (once per cold start) ─────────────────────────────────────────
let wasmReady = false;
async function ensureWasm() {
  if (wasmReady) return;
  const wasmPath = require.resolve('@resvg/resvg-wasm/index_bg.wasm');
  await initWasm(readFileSync(wasmPath));
  wasmReady = true;
}

// ─── Font (Inter Bold + Regular, fetched once per cold start) ─────────────────
let fontBold = null;
let fontRegular = null;
async function loadFonts() {
  if (fontBold && fontRegular) return;
  const [b, r] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZJhiI2B.woff')
      .then(res => res.arrayBuffer()).catch(() => null),
    fetch('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhiI2B.woff')
      .then(res => res.arrayBuffer()).catch(() => null),
  ]);
  if (b) fontBold = b;
  if (r) fontRegular = r;
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
    padding: '48px 64px', fontFamily: 'Inter',
  }, [
    // Header row
    div({ alignItems: 'center', gap: 16, marginBottom: 'auto' }, [
      div({ width: 52, height: 52, background: accent, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, [
        text({ fontSize: 28, color: '#fff' }, '⚡'),
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
    padding: '48px 64px', fontFamily: 'Inter',
  }, [
    div({ alignItems: 'center', gap: 16, marginBottom: 'auto' }, [
      div({ width: 52, height: 52, background: '#6366f1', borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, [
        text({ fontSize: 28, color: '#fff' }, '⚡'),
      ]),
      text({ fontSize: 24, fontWeight: 700, color: '#fff' }, 'MKD Slidea'),
    ]),
    div({
      background: '#6366f122', border: '1.5px solid #6366f144',
      borderRadius: 999, padding: '8px 20px', width: 'fit-content', marginBottom: 24,
    }, [text({ fontSize: 18, fontWeight: 700, color: '#818cf8' }, '🔴 Live сесија')]),
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
    padding: '0 64px', fontFamily: 'Inter',
  }, [
    div({ width: 96, height: 96, background: '#6366f1', borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }, [
      text({ fontSize: 52, color: '#fff' }, '⚡'),
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
    const url     = new URL(req.url, `https://${req.headers.host}`);
    const type    = url.searchParams.get('type') || 'default';
    const title   = url.searchParams.get('title') || '';
    const subject = url.searchParams.get('subject') || '';
    const grade   = url.searchParams.get('grade') || '';
    const code    = url.searchParams.get('code') || '';

    await Promise.all([ensureWasm(), loadFonts()]);

    const fonts = [];
    if (fontBold)    fonts.push({ name: 'Inter', data: fontBold,    weight: 700, style: 'normal' });
    if (fontRegular) fonts.push({ name: 'Inter', data: fontRegular, weight: 400, style: 'normal' });

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
    res.status(500).send(`PNG Error: ${err.message}`);
  }
}
