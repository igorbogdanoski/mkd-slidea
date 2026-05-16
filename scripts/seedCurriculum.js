// ============================================================================
// Sprint 8.1.3 — Seed `curriculum_chunks` од MK курикулум таксономии
// ----------------------------------------------------------------------------
// Cmd:
//   node scripts/seedCurriculum.js
//
// Чита .env.local за SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Embeddings НЕ ги пополнува овде — тоа го прави /api/embed-batch (cron).
//
// Idempotent: UNIQUE(track, grade, subject, topic, subtopic, text) во SQL,
// користиме `Prefer: resolution=merge-duplicates` за upsert.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ─── tiny .env loader ────────────────────────────────────────────
function loadDotenv(file) {
  try {
    const raw = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const k = m[1];
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch { /* file missing */ }
}
loadDotenv('.env.local');
loadDotenv('.env');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Недостасуваат SUPABASE_URL и/или SUPABASE_SERVICE_ROLE_KEY во .env.local');
  process.exit(1);
}

// ─── load curriculum data ───────────────────────────────────────
const SUBJECT_LABELS = {
  math: 'Математика', biology: 'Биологија', chemistry: 'Хемија',
  physics: 'Физика', cs: 'Информатика', history: 'Историја',
  geography: 'Географија', mk_language: 'Македонски јазик', english: 'Англиски јазик',
};

const toPath = (rel) => pathToFileURL(path.join(ROOT, 'src', 'data', rel)).href;

const [
  { default: MK_MATH_PRIMARY },
  { default: MK_MATH_SECONDARY },
  { default: MK_SUBJECTS },
] = await Promise.all([
  import(toPath('mkMathCurriculum.js')),
  import(toPath('mkMathSecondaryCurriculum.js')),
  import(toPath('mkSubjectsCurriculum.js')),
]);

const ALL_SOURCES = [
  ...(Array.isArray(MK_MATH_PRIMARY) ? MK_MATH_PRIMARY : []),
  ...(Array.isArray(MK_MATH_SECONDARY) ? MK_MATH_SECONDARY : []),
  ...(Array.isArray(MK_SUBJECTS) ? MK_SUBJECTS : []),
];

if (!ALL_SOURCES.length) {
  console.error('❌ Сите извори на курикулум се празни.');
  process.exit(1);
}

console.log(`📚 Извори: math primary=${Array.isArray(MK_MATH_PRIMARY) ? MK_MATH_PRIMARY.length : 0}, math secondary=${Array.isArray(MK_MATH_SECONDARY) ? MK_MATH_SECONDARY.length : 0}, subjects=${Array.isArray(MK_SUBJECTS) ? MK_SUBJECTS.length : 0}`);

// ─── build chunks ───────────────────────────────────────────────
const rows = ALL_SOURCES.map((c) => {
  const subjectLabel = SUBJECT_LABELS[c.subject] || c.subject || 'Општо';
  const text = [
    `Предмет: ${subjectLabel}`,
    c.grade != null ? `Одделение: G${c.grade}` : '',
    c.track && c.track !== 'primary' ? `Насока: ${c.track}` : '',
    c.topic ? `Област: ${c.topic}` : '',
    c.subtopic ? `Тема: ${c.subtopic}` : '',
    Array.isArray(c.keywords) && c.keywords.length
      ? `Клучни поими: ${c.keywords.join(', ')}` : '',
  ].filter(Boolean).join('. ');
  return {
    track: c.track || 'primary',
    grade: `G${c.grade}`,
    subject: c.subject || 'math',
    topic: c.topic || null,
    subtopic: c.subtopic || null,
    text,
    tags: Array.isArray(c.keywords) ? c.keywords.slice(0, 12) : [],
    source: c.subject === 'math' ? 'mkMathCurriculum' : 'mkSubjectsCurriculum',
  };
});

console.log(`📚 ${rows.length} curriculum chunks за upsert...`);

// ─── batched upsert ─────────────────────────────────────────────
const BATCH = 50;
let done = 0;
let failed = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const slice = rows.slice(i, i + BATCH);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/curriculum_chunks?on_conflict=track,grade,subject,topic,subtopic,text`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify(slice),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`❌ batch ${i / BATCH + 1} HTTP ${res.status}: ${text.slice(0, 300)}`);
      failed += slice.length;
    } else {
      done += slice.length;
      process.stdout.write(`  ✔ ${done}/${rows.length}\r`);
    }
  } catch (err) {
    console.error(`❌ batch ${i / BATCH + 1} error:`, err.message);
    failed += slice.length;
  }
}

console.log(`\n✅ Готово: ${done} upsert-ирани, ${failed} неуспешни.`);
console.log(`👉 Следно: cron /api/embed-batch ќе ги пополни embeddings (или ad-hoc curl).`);
