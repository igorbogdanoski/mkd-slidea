// ============================================================================
// Enrich curriculum_chunks with official BRO document URLs
// ----------------------------------------------------------------------------
// Reads src/data/broCurriculumIndex.json (output of scrapeBroCurriculum.js)
// and matches documents to existing curriculum_chunks by subject + grade,
// then updates source_url in Supabase.
//
// Usage:
//   node scripts/scrapeBroCurriculum.js   (first — builds the index)
//   node scripts/enrichCurriculumWithBro.js
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
  console.error('❌ broCurriculumIndex.json не постои. Пушти прво: node scripts/scrapeBroCurriculum.js');
  process.exit(1);
}

const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
const allDocs = [...(index.primary || []), ...(index.secondary || [])];
console.log(`📄 Вчитани ${allDocs.length} документи од BRO индексот.`);

// ─── Subject keyword → internal subject code ──────────────────────────────
const SUBJECT_KEYWORDS = {
  math:        ['математика', 'math'],
  biology:     ['биологија', 'природни науки', 'biology'],
  chemistry:   ['хемија', 'chemistry'],
  physics:     ['физика', 'physics'],
  cs:          ['информатика', 'технологија', 'digitalna', 'дигитал'],
  history:     ['историја', 'history'],
  geography:   ['географија', 'geography'],
  mk_language: ['македонски јазик', 'македонски', 'mk language'],
  english:     ['англиски', 'english'],
};

function guessSubject(title) {
  const lower = title.toLowerCase();
  for (const [subj, kws] of Object.entries(SUBJECT_KEYWORDS)) {
    if (kws.some((k) => lower.includes(k))) return subj;
  }
  return null;
}

// ─── Grade map: "I одделение" / "G1" etc. ────────────────────────────────
function guessGrade(gradeStr) {
  if (!gradeStr) return null;
  if (/^G\d+$/.test(gradeStr)) return gradeStr;
  return null;
}

// ─── Build lookup: subject+grade → best doc URL ──────────────────────────
const lookup = new Map(); // key: "math_G8" → { title, url }

for (const doc of allDocs) {
  // Try to infer subject from title or context
  const subj = guessSubject(doc.title) || guessSubject(doc.subject_context || '');
  const grade = guessGrade(doc.grade);
  if (!subj || !grade) continue;

  const key = `${subj}_${grade}`;
  if (!lookup.has(key)) {
    lookup.set(key, { title: doc.title, url: doc.url });
  }
}

console.log(`🔑 ${lookup.size} уникатни subject+grade пресеци пронајдени.`);

// ─── Fetch all curriculum_chunks without source_url ───────────────────────
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

const chunks = await sb('/rest/v1/curriculum_chunks?select=id,subject,grade&source_url=is.null&limit=500');
console.log(`🔍 ${chunks?.length || 0} chunks без source_url.`);

if (!chunks || chunks.length === 0) {
  console.log('✅ Сите chunks веќе имаат source_url — нема ништо за ажурирање.');
  process.exit(0);
}

// ─── Match and update ─────────────────────────────────────────────────────
let updated = 0;
let skipped = 0;

for (const chunk of chunks) {
  const key = `${chunk.subject}_${chunk.grade}`;
  const match = lookup.get(key);
  if (!match) { skipped++; continue; }

  try {
    await sb(
      `/rest/v1/curriculum_chunks?id=eq.${chunk.id}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ source_url: match.url }),
      }
    );
    updated++;
    process.stdout.write(`  ✔ ${chunk.subject} ${chunk.grade}\r`);
  } catch (e) {
    console.error(`  ✗ chunk ${chunk.id}: ${e.message}`);
  }
}

console.log(`\n✅ Ажурирани ${updated} chunks со официјален БРО линк.`);
console.log(`○  ${skipped} chunks без совпаѓање.`);
console.log('\n👉 SemanticSearchTab ќе ги прикажува „📄 Официјален документ" линковите.');
