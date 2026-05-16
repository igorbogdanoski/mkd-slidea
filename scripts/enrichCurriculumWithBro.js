// ============================================================================
// Enrich curriculum_chunks with official BRO category page URLs
// ----------------------------------------------------------------------------
// Reads src/data/broCurriculumIndex.json and maps grade+track → BRO page URL.
// Updates source_url in Supabase curriculum_chunks.
//
// Strategy: BRO organises documents by grade-level category pages.
// Each category page is a valid official reference even if the PDF inside
// is the same monograph (the page lists all curricula for that grade).
//
// Usage:
//   node --use-system-ca scripts/enrichCurriculumWithBro.js
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── tiny .env loader ────────────────────────────────────────────────────────
function loadDotenv(file) {
  try {
    const raw = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const k = m[1];
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  } catch { /* ok */ }
}
loadDotenv('.env.local');
loadDotenv('.env');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Недостасуваат SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const INDEX_PATH = path.join(ROOT, 'src', 'data', 'broCurriculumIndex.json');
if (!fs.existsSync(INDEX_PATH)) {
  console.error('❌ broCurriculumIndex.json не постои. Пушти прво: node --use-system-ca scripts/scrapeBroCurriculum.js');
  process.exit(1);
}

const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
const allDocs = [...(index.primary || []), ...(index.secondary || [])];
console.log(`📄 Вчитани ${allDocs.length} документи од BRO индексот.`);

// ─── Track name normalisation ────────────────────────────────────────────────
// BRO context → internal track codes used in curriculum_chunks
const TRACK_KEYWORDS = {
  gymnasium:   ['гимназиско', 'гимназија', 'gymnasium'],
  vocational4: ['четиригодишно', 'четири год'],
  vocational3: ['тригодишно', 'три год'],
  vocational2: ['двегодишно', 'две год'],
  math_gymnasium: ['математичко', 'math'],
  sports:      ['спортска'],
  music:       ['музичко'],
  arts:        ['уметничко'],
  primary:     ['primary', 'одделение'],
};

function guessTrack(contextName) {
  const lower = contextName.toLowerCase();
  for (const [track, kws] of Object.entries(TRACK_KEYWORDS)) {
    if (kws.some((k) => lower.includes(k))) return track;
  }
  return 'primary';
}

// ─── Build lookup: grade+track → BRO category page URL ──────────────────────
// BRO page URL is constructed from source_idcat (not the PDF URL inside it).
const BASE_BRO = 'https://bro.gov.mk/podkategorii/?customposttype=documents_category&idcat=';
const lookup = new Map(); // key: "G1_primary" or "G10_gymnasium" → page URL

for (const doc of allDocs) {
  if (!doc.grade || !doc.source_idcat) continue;
  const track = guessTrack(doc.subject_context || '');
  const key = `${doc.grade}_${track}`;
  if (!lookup.has(key)) {
    // Use the official BRO category page URL (not the monograph PDF)
    const pageUrl = `${BASE_BRO}${doc.source_idcat}`;
    lookup.set(key, pageUrl);
  }
}

console.log(`🔑 ${lookup.size} grade+track пресеци пронајдени.`);
if (lookup.size > 0) {
  console.log('   Примери:', [...lookup.entries()].slice(0, 5).map(([k, v]) => `${k} → ...idcat=${v.split('idcat=')[1]}`).join(', '));
}

// ─── Supabase helper ──────────────────────────────────────────────────────────
async function sb(path2, init = {}) {
  const res = await fetch(`${SUPABASE_URL}${path2}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text().catch(() => '')}`);
  if (res.status === 204) return null;
  return res.json();
}

// ─── Fetch chunks without source_url ─────────────────────────────────────────
const chunks = await sb('/rest/v1/curriculum_chunks?select=id,subject,grade,track&source_url=is.null&limit=500');
console.log(`🔍 ${chunks?.length || 0} chunks без source_url.`);

if (!chunks || chunks.length === 0) {
  console.log('✅ Сите chunks веќе имаат source_url — нема ништо за ажурирање.');
  process.exit(0);
}

// ─── Match and update ─────────────────────────────────────────────────────────
let updated = 0;
let skipped = 0;

for (const chunk of chunks) {
  // Try exact grade+track match first, then grade+primary fallback
  const key1 = `${chunk.grade}_${chunk.track}`;
  const key2 = `${chunk.grade}_primary`;
  const match = lookup.get(key1) || lookup.get(key2);
  if (!match) { skipped++; continue; }

  try {
    await sb(
      `/rest/v1/curriculum_chunks?id=eq.${chunk.id}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ source_url: match }),
      }
    );
    updated++;
    process.stdout.write(`  ✔ ${chunk.subject} ${chunk.grade} (${chunk.track})\r`);
  } catch (e) {
    console.error(`  ✗ chunk ${chunk.id}: ${e.message}`);
  }
}

console.log(`\n✅ Ажурирани ${updated} chunks со официјален БРО линк.`);
console.log(`○  ${skipped} chunks без совпаѓање.`);
console.log('\n👉 SemanticSearchTab ќе ги прикажува „Официјален БРО документ" линковите.');
