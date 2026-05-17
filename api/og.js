// OG Image Generator — SVG-based, no WASM, Edge-safe
// GET /api/og?type=template&title=...&subject=...&grade=...
// GET /api/og?type=event&title=...&code=...
// GET /api/og  (default branded)
//
// Returns SVG 1200x630. For PNG (Facebook/LinkedIn), upgrade to a
// Node.js canvas function in a future sprint.

export const config = { runtime: 'edge' };

const W = 1200;
const H = 630;

const SUBJECT_COLORS = {
  'Математика':  '#6366f1',
  'Физика':      '#8b5cf6',
  'Хемија':      '#0ea5e9',
  'Биологија':   '#10b981',
  'Историја':    '#f59e0b',
  'Географија':   '#14b8a6',
  'Јазик':       '#f43f5e',
  'Информатика': '#3b82f6',
};

function subjectColor(subject = '') {
  for (const [k, v] of Object.entries(SUBJECT_COLORS)) {
    if (subject.includes(k)) return v;
  }
  return '#6366f1';
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(text, maxLen = 42) {
  const words = String(text || '').split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxLen) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function templateSvg({ title, subject, grade }) {
  const accent = subjectColor(subject);
  const lines = wrap(title || 'MKD Slidea', 40);
  const fontSize = lines[0]?.length > 30 ? 58 : 68;
  const linesY = lines.map((_, i) => 300 + i * (fontSize + 8));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0c29"/>
      <stop offset="50%" style="stop-color:#302b63"/>
      <stop offset="100%" style="stop-color:#24243e"/>
    </linearGradient>
    <radialGradient id="glow1" cx="100%" cy="0%" r="50%">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:0.2"/>
      <stop offset="100%" style="stop-color:${accent};stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${W}" cy="0" r="380" fill="url(#glow1)"/>
  <!-- Logo box -->
  <rect x="64" y="40" width="52" height="52" rx="16" fill="${accent}"/>
  <text x="90" y="76" font-family="system-ui,sans-serif" font-size="28" text-anchor="middle" fill="white">⚡</text>
  <text x="132" y="76" font-family="system-ui,sans-serif" font-size="24" font-weight="700" fill="white">MKD Slidea</text>
  <!-- Subject + grade tags -->
  ${subject ? `<rect x="64" y="230" width="${esc(subject).length * 14 + 40}" height="38" rx="19" fill="${accent}33" stroke="${accent}88" stroke-width="1.5"/>
  <text x="${64 + esc(subject).length * 7 + 20}" y="254" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="${accent}" text-anchor="middle">${esc(subject)}</text>` : ''}
  ${grade ? `<rect x="${subject ? esc(subject).length * 14 + 120 : 64}" y="230" width="90" height="38" rx="19" fill="#ffffff11" stroke="#ffffff33" stroke-width="1.5"/>
  <text x="${subject ? esc(subject).length * 14 + 165 : 109}" y="254" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#9ca3af" text-anchor="middle">${esc(grade)}</text>` : ''}
  <!-- Title lines -->
  ${lines.map((l, i) => `<text x="64" y="${(subject || grade ? 310 : 270) + i * (fontSize + 10)}" font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="700" fill="white">${esc(l)}</text>`).join('\n  ')}
  <!-- Bottom line -->
  <line x1="64" y1="560" x2="${W - 64}" y2="560" stroke="#ffffff18" stroke-width="2"/>
  <text x="${W - 64}" y="595" font-family="system-ui,sans-serif" font-size="18" fill="#6b7280" text-anchor="end">slidea.mismath.net/templates</text>
</svg>`;
}

function eventSvg({ title, code }) {
  const lines = wrap(title || 'Интерактивна сесија', 40);
  const fontSize = lines[0]?.length > 30 ? 58 : 68;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e1b4b"/>
      <stop offset="50%" style="stop-color:#312e81"/>
      <stop offset="100%" style="stop-color:#1e1b4b"/>
    </linearGradient>
    <radialGradient id="glow1" cx="100%" cy="0%" r="50%">
      <stop offset="0%" style="stop-color:#818cf8;stop-opacity:0.15"/>
      <stop offset="100%" style="stop-color:#818cf8;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${W}" cy="0" r="380" fill="url(#glow1)"/>
  <!-- Logo -->
  <rect x="64" y="40" width="52" height="52" rx="16" fill="#6366f1"/>
  <text x="90" y="76" font-family="system-ui,sans-serif" font-size="28" text-anchor="middle" fill="white">⚡</text>
  <text x="132" y="76" font-family="system-ui,sans-serif" font-size="24" font-weight="700" fill="white">MKD Slidea</text>
  <!-- Live badge -->
  <rect x="64" y="230" width="148" height="38" rx="19" fill="#6366f122" stroke="#6366f144" stroke-width="1.5"/>
  <text x="138" y="254" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#818cf8" text-anchor="middle">🔴 Live сесија</text>
  <!-- Title -->
  ${lines.map((l, i) => `<text x="64" y="${300 + i * (fontSize + 10)}" font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="700" fill="white">${esc(l)}</text>`).join('\n  ')}
  <!-- Code -->
  ${code ? `<text x="64" y="540" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="#6b7280" letter-spacing="3">КОД:</text>
  <text x="160" y="540" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="#a5b4fc" letter-spacing="8">${esc(code)}</text>` : ''}
  <!-- Bottom -->
  <line x1="64" y1="590" x2="${W - 64}" y2="590" stroke="#ffffff18" stroke-width="2"/>
  <text x="${W - 64}" y="618" font-family="system-ui,sans-serif" font-size="18" fill="#6b7280" text-anchor="end">slidea.mismath.net</text>
</svg>`;
}

function defaultSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0c29"/>
      <stop offset="50%" style="stop-color:#302b63"/>
      <stop offset="100%" style="stop-color:#24243e"/>
    </linearGradient>
    <radialGradient id="glow1" cx="80%" cy="20%" r="50%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:0.25"/>
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="20%" cy="80%" r="40%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.18"/>
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${W * 0.8}" cy="${H * 0.2}" r="380" fill="url(#glow1)"/>
  <circle cx="${W * 0.2}" cy="${H * 0.8}" r="320" fill="url(#glow2)"/>
  <!-- Logo box -->
  <rect x="${W/2 - 48}" y="160" width="96" height="96" rx="28" fill="#6366f1"/>
  <text x="${W/2}" y="228" font-family="system-ui,sans-serif" font-size="52" text-anchor="middle" fill="white">⚡</text>
  <!-- Title -->
  <text x="${W/2}" y="340" font-family="system-ui,sans-serif" font-size="80" font-weight="700" fill="white" text-anchor="middle">MKD Slidea</text>
  <!-- Subtitle -->
  <text x="${W/2}" y="400" font-family="system-ui,sans-serif" font-size="26" fill="#9ca3af" text-anchor="middle">Интерактивна платформа за настава на македонски јазик</text>
  <!-- Tags -->
  <rect x="210" y="450" width="160" height="44" rx="22" fill="#ffffff12" stroke="#ffffff22" stroke-width="1"/>
  <text x="290" y="477" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#d1d5db" text-anchor="middle">Квизови</text>
  <rect x="390" y="450" width="160" height="44" rx="22" fill="#ffffff12" stroke="#ffffff22" stroke-width="1"/>
  <text x="470" y="477" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#d1d5db" text-anchor="middle">Анкети</text>
  <rect x="570" y="450" width="200" height="44" rx="22" fill="#ffffff12" stroke="#ffffff22" stroke-width="1"/>
  <text x="670" y="477" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#d1d5db" text-anchor="middle">AI Генерирање</text>
  <rect x="790" y="450" width="220" height="44" rx="22" fill="#ffffff12" stroke="#ffffff22" stroke-width="1"/>
  <text x="900" y="477" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#d1d5db" text-anchor="middle">Live Резултати</text>
</svg>`;
}

export default async function handler(req) {
  try {
    const url  = new URL(req.url);
    const type    = url.searchParams.get('type') || 'default';
    const title   = url.searchParams.get('title') || '';
    const subject = url.searchParams.get('subject') || '';
    const grade   = url.searchParams.get('grade') || '';
    const code    = url.searchParams.get('code') || '';

    let svg;
    if (type === 'template') svg = templateSvg({ title, subject, grade });
    else if (type === 'event') svg = eventSvg({ title, code });
    else svg = defaultSvg();

    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(`OG Error: ${e.message}`, { status: 500 });
  }
}
