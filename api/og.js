// Sprint 8.2.3 — OG Image Generator (Edge Function)
// GET /api/og?type=template&title=...&subject=...&grade=...
// GET /api/og?type=event&title=...&code=...
// GET /api/og  (default branded)
//
// Uses @vercel/og (satori) — zero extra cost, runs on Edge.
// Font: Inter w/ Cyrillic subset fetched from Google Fonts.

import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const W = 1200;
const H = 630;

// Fetch Inter Cyrillic font once per cold start
let _fontBold = null;
let _fontRegular = null;

async function getFont(weight) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }
  ).then(r => r.text()).catch(() => '');

  const match = css.match(/src:\s*url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/);
  if (!match) return null;
  return fetch(match[1]).then(r => r.arrayBuffer()).catch(() => null);
}

async function fonts() {
  if (!_fontBold)    _fontBold    = await getFont(700);
  if (!_fontRegular) _fontRegular = await getFont(400);
  const result = [];
  if (_fontBold)    result.push({ name: 'Inter', data: _fontBold,    weight: 700, style: 'normal' });
  if (_fontRegular) result.push({ name: 'Inter', data: _fontRegular, weight: 400, style: 'normal' });
  return result;
}

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

function subjectColor(subject) {
  for (const [k, v] of Object.entries(SUBJECT_COLORS)) {
    if ((subject || '').includes(k)) return v;
  }
  return '#6366f1';
}

// ─── Template OG ──────────────────────────────────────────────────────────────
function TemplateCard({ title, subject, grade }) {
  const accent = subjectColor(subject);
  const shortTitle = (title || 'MKD Slidea').slice(0, 60);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: W, height: H,
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -120, right: -120, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)` }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, #6366f122 0%, transparent 70%)' }} />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '40px 64px 0', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: accent, borderRadius: 16, fontSize: 28 }}>⚡</div>
        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 26, letterSpacing: -0.5 }}>MKD Slidea</span>
        <div style={{ flex: 1 }} />
        <div style={{ background: '#ffffff15', border: '1px solid #ffffff25', borderRadius: 999, padding: '8px 20px', color: '#9ca3af', fontSize: 18, fontWeight: 400 }}>
          Шаблон за настава
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 64px 0' }}>
        {/* Tags */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          {subject && (
            <div style={{ background: `${accent}22`, border: `1.5px solid ${accent}55`, borderRadius: 999, padding: '8px 20px', color: accent, fontSize: 18, fontWeight: 700 }}>
              {subject}
            </div>
          )}
          {grade && (
            <div style={{ background: '#ffffff10', border: '1.5px solid #ffffff25', borderRadius: 999, padding: '8px 20px', color: '#9ca3af', fontSize: 18, fontWeight: 700 }}>
              {grade}
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: shortTitle.length > 40 ? 52 : 64, lineHeight: 1.15, letterSpacing: -1, maxWidth: 900 }}>
          {shortTitle}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 64px 44px', gap: 16 }}>
        <div style={{ flex: 1, height: 2, background: '#ffffff10', borderRadius: 2 }} />
        <span style={{ color: '#6b7280', fontSize: 18, fontWeight: 400 }}>slidea.mismath.net/templates</span>
      </div>
    </div>
  );
}

// ─── Event OG ─────────────────────────────────────────────────────────────────
function EventCard({ title, code }) {
  const shortTitle = (title || 'Интерактивна сесија').slice(0, 60);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: W, height: H,
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -100, right: -100, width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, #818cf822 0%, transparent 70%)' }} />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '40px 64px 0', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: '#6366f1', borderRadius: 16, fontSize: 28 }}>⚡</div>
        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 26, letterSpacing: -0.5 }}>MKD Slidea</span>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px 64px' }}>
        <div style={{ background: '#6366f122', border: '1.5px solid #6366f144', borderRadius: 999, padding: '8px 20px', color: '#818cf8', fontSize: 18, fontWeight: 700, marginBottom: 28, display: 'flex', width: 'fit-content' }}>
          🔴 Live сесија
        </div>
        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: shortTitle.length > 40 ? 52 : 64, lineHeight: 1.15, letterSpacing: -1, maxWidth: 900, marginBottom: 32 }}>
          {shortTitle}
        </div>
        {code && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#6b7280', fontWeight: 700, fontSize: 22, textTransform: 'uppercase', letterSpacing: 3 }}>Код:</span>
            <span style={{ color: '#a5b4fc', fontWeight: 700, fontSize: 36, letterSpacing: 6, fontVariantNumeric: 'tabular-nums' }}>{code}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '0 64px 44px', gap: 16 }}>
        <div style={{ flex: 1, height: 2, background: '#ffffff10', borderRadius: 2 }} />
        <span style={{ color: '#6b7280', fontSize: 18, fontWeight: 400 }}>slidea.mismath.net</span>
      </div>
    </div>
  );
}

// ─── Default OG ───────────────────────────────────────────────────────────────
function DefaultCard() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: W, height: H,
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -120, right: -120, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, #6366f133 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, #8b5cf622 0%, transparent 70%)' }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 96, height: 96, background: '#6366f1', borderRadius: 28, fontSize: 52, marginBottom: 32 }}>⚡</div>
        <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 80, letterSpacing: -3, marginBottom: 16 }}>MKD Slidea</div>
        <div style={{ color: '#9ca3af', fontWeight: 400, fontSize: 28, textAlign: 'center', maxWidth: 700, lineHeight: 1.5 }}>
          Интерактивна платформа за настава на македонски јазик
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 48 }}>
          {['Квизови', 'Анкети', 'AI Генерирање', 'Live Резултати'].map(tag => (
            <div key={tag} style={{ background: '#ffffff10', border: '1px solid #ffffff20', borderRadius: 999, padding: '10px 24px', color: '#d1d5db', fontSize: 18, fontWeight: 700 }}>
              {tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const type    = url.searchParams.get('type') || 'default';
    const title   = url.searchParams.get('title') || '';
    const subject = url.searchParams.get('subject') || '';
    const grade   = url.searchParams.get('grade') || '';
    const code    = url.searchParams.get('code') || '';

    const fontData = await fonts();

    let element;
    if (type === 'template') {
      element = <TemplateCard title={title} subject={subject} grade={grade} />;
    } else if (type === 'event') {
      element = <EventCard title={title} code={code} />;
    } else {
      element = <DefaultCard />;
    }

    return new ImageResponse(element, {
      width: W,
      height: H,
      fonts: fontData,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(`OG Error: ${e.message}`, { status: 500 });
  }
}
